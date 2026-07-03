import time
import threading
import ctypes
from pynput import mouse, keyboard

# Helper to get the active window title on Windows
def get_active_window_title():
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buf = ctypes.create_unicode_buffer(length + 1)
            ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
            return buf.value
    except Exception:
        pass
    return ""

class MacroRecorder:
    def __init__(self, on_event_callback=None, record_mouse_moves=True):
        self.events = []
        self.start_time = None
        self.mouse_listener = None
        self.keyboard_listener = None
        self.active_window_thread = None
        self.is_recording = False
        self.last_window = None
        self.last_mouse_move_time = 0
        self.on_event_callback = on_event_callback # Function to send event info to UI
        self.record_mouse_moves = record_mouse_moves
        
    def _get_elapsed(self):
        return int((time.time() - self.start_time) * 1000) # milliseconds

    def _record_event(self, event_type, details):
        if not self.is_recording:
            return
        elapsed = self._get_elapsed()
        event = {
            'time': elapsed,
            'type': event_type,
            'details': details
        }
        self.events.append(event)
        if self.on_event_callback:
            self.on_event_callback(event)

    def on_move(self, x, y):
        if not self.record_mouse_moves:
            return
        # Throttle mouse moves to avoid massive event logs (min 15ms interval)
        current_time = time.time()
        if current_time - self.last_mouse_move_time >= 0.015:
            self._record_event('mouse_move', {'x': x, 'y': y})
            self.last_mouse_move_time = current_time

    def on_click(self, x, y, button, pressed):
        self._record_event('mouse_click', {
            'x': x,
            'y': y,
            'button': button.name,
            'pressed': pressed
        })

    def on_scroll(self, x, y, dx, dy):
        self._record_event('mouse_scroll', {
            'x': x,
            'y': y,
            'dx': dx,
            'dy': dy
        })

    def on_press(self, key):
        # Format key as a string
        key_str = self._format_key(key)
        self._record_event('key_press', {'key': key_str})

    def on_release(self, key):
        key_str = self._format_key(key)
        self._record_event('key_release', {'key': key_str})

    def _format_key(self, key):
        try:
            if hasattr(key, 'char') and key.char is not None:
                return key.char
            else:
                return key.name
        except Exception:
            return str(key)

    def _monitor_active_window(self):
        self.last_window = get_active_window_title()
        # Record initial window
        if self.last_window:
            self._record_event('window_change', {'title': self.last_window})
            
        while self.is_recording:
            current_window = get_active_window_title()
            if current_window != self.last_window:
                self.last_window = current_window
                self._record_event('window_change', {'title': current_window})
            time.sleep(0.1)

    def start(self):
        self.events = []
        self.start_time = time.time()
        self.is_recording = True
        self.last_mouse_move_time = 0

        # Start active window monitor thread
        self.active_window_thread = threading.Thread(target=self._monitor_active_window, daemon=True)
        self.active_window_thread.start()

        # Start listeners
        self.mouse_listener = mouse.Listener(
            on_move=self.on_move,
            on_click=self.on_click,
            on_scroll=self.on_scroll
        )
        self.keyboard_listener = keyboard.Listener(
            on_press=self.on_press,
            on_release=self.on_release
        )

        self.mouse_listener.start()
        self.keyboard_listener.start()

    def stop(self):
        self.is_recording = False
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()
        return self.events


class MacroPlayer:
    def __init__(self, on_state_change=None):
        self.is_playing = False
        self.stop_event = threading.Event()
        self.play_thread = None
        self.mouse_controller = mouse.Controller()
        self.keyboard_controller = keyboard.Controller()
        self.on_state_change = on_state_change # Callbacks for status updates

    def _interruptible_sleep(self, duration_ms):
        if duration_ms <= 0:
            return True
        start = time.time()
        duration_s = duration_ms / 1000.0
        while time.time() - start < duration_s:
            if self.stop_event.is_set():
                return False
            time.sleep(0.005) # Sleep 5ms
        return True

    def _play_macro(self, events, loop_count, speed_multiplier, delay_override, fixed_delay_ms):
        self.is_playing = True
        if self.on_state_change:
            self.on_state_change('playing', 1)

        # Parse key mappings to correct pynput Key attributes
        def get_pynput_key(key_str):
            if len(key_str) == 1:
                return key_str
            # Standard special keys
            if hasattr(keyboard.Key, key_str):
                return getattr(keyboard.Key, key_str)
            return key_str

        # Parse mouse button names
        def get_pynput_button(btn_str):
            if hasattr(mouse.Button, btn_str):
                return getattr(mouse.Button, btn_str)
            return mouse.Button.left

        for loop in range(1, loop_count + 1):
            if self.stop_event.is_set():
                break

            if self.on_state_change:
                self.on_state_change('playing', loop)

            # Store the elapsed start of this loop
            last_event_time = 0

            for event in events:
                if self.stop_event.is_set():
                    break

                # Calculate delay according to settings
                if delay_override == 'fixed':
                    delay = fixed_delay_ms
                else: # 'original'
                    if speed_multiplier == 'instant':
                        delay = 0
                    else:
                        delay = (event['time'] - last_event_time) / float(speed_multiplier)

                if delay > 0:
                    if not self._interruptible_sleep(delay):
                        break
                
                last_event_time = event['time']

                # Execute action
                try:
                    e_type = event['type']
                    details = event['details']

                    if e_type == 'mouse_move':
                        self.mouse_controller.position = (details['x'], details['y'])
                    elif e_type == 'mouse_click':
                        self.mouse_controller.position = (details['x'], details['y'])
                        btn = get_pynput_button(details['button'])
                        if details['pressed']:
                            self.mouse_controller.press(btn)
                        else:
                            self.mouse_controller.release(btn)
                    elif e_type == 'mouse_scroll':
                        self.mouse_controller.position = (details['x'], details['y'])
                        self.mouse_controller.scroll(details['dx'], details['dy'])
                    elif e_type == 'key_press':
                        key = get_pynput_key(details['key'])
                        self.keyboard_controller.press(key)
                    elif e_type == 'key_release':
                        key = get_pynput_key(details['key'])
                        self.keyboard_controller.release(key)
                    elif e_type == 'window_change':
                        # Visual notification only
                        pass
                except Exception as e:
                    print(f"Error replaying event: {e}")

        self.is_playing = False
        self.stop_event.clear()
        if self.on_state_change:
            self.on_state_change('idle', 0)

    def start(self, events, loop_count=1, speed_multiplier=1.0, delay_override='original', fixed_delay_ms=100):
        if self.is_playing:
            return
        self.stop_event.clear()
        self.play_thread = threading.Thread(
            target=self._play_macro, 
            args=(events, loop_count, speed_multiplier, delay_override, fixed_delay_ms), 
            daemon=True
        )
        self.play_thread.start()

    def stop(self):
        if not self.is_playing:
            return
        self.stop_event.set()
        if self.play_thread:
            self.play_thread.join(timeout=1.0)
        self.is_playing = False
        self.stop_event.clear()
