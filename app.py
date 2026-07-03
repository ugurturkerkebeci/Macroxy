import socket
import _socket

# Monkey patch socket functions to handle UnicodeDecodeError on Windows machines with non-ASCII hostnames
orig_getfqdn = socket.getfqdn
def safe_getfqdn(name=''):
    try:
        return orig_getfqdn(name)
    except Exception:
        return 'localhost'
socket.getfqdn = safe_getfqdn

orig_gethostbyaddr = socket.gethostbyaddr
def safe_gethostbyaddr(ip):
    try:
        return orig_gethostbyaddr(ip)
    except Exception:
        return ('localhost', [], [ip])
socket.gethostbyaddr = safe_gethostbyaddr

orig_gethostbyaddr_c = _socket.gethostbyaddr
def safe_gethostbyaddr_c(ip):
    try:
        return orig_gethostbyaddr_c(ip)
    except Exception:
        return ('localhost', [], [ip])
_socket.gethostbyaddr = safe_gethostbyaddr_c

import os
import json
import sys
import time
import threading
import webview
import webbrowser
from pynput import keyboard
from macro_manager import MacroRecorder, MacroPlayer

def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

# Global variables
recorder = None
player = None
active_hotkey = 'esc' # Default emergency stop key
record_hotkey = 'ctrl+alt+r' # Default record toggle key
hotkey_listener = None
window = None # Will store the webview window reference

last_trigger_time = 0.0
hotkey_lock = threading.Lock()

state = {
    'is_recording': False,
    'is_playing': False,
    'current_loop': 0
}

action_lock = threading.Lock()

# JS notification helpers
def notify_js(func_name, data=None):
    if window:
        try:
            if data is not None:
                # Safely serialize data to JSON
                js_data = json.dumps(data)
                window.evaluate_js(f"{func_name}({js_data})")
            else:
                window.evaluate_js(f"{func_name}()")
        except Exception as e:
            print(f"Error evaluating JS {func_name}: {e}")

def to_pynput_hotkey(hotkey_str):
    parts = [part.strip().lower() for part in hotkey_str.split('+') if part.strip()]
    pynput_parts = []
    for part in parts:
        if part in ('ctrl', 'alt', 'shift', 'cmd', 'win', 'esc', 'space', 'enter', 'tab', 'backspace', 'delete', 'insert', 'up', 'down', 'left', 'right'):
            name = part
            if name == 'win':
                name = 'cmd'
            pynput_parts.append(f"<{name}>")
        else:
            pynput_parts.append(part)
    return "+".join(pynput_parts)

def trigger_emergency_stop():
    with action_lock:
        global state, last_trigger_time
        current_time = time.time()
        if current_time - last_trigger_time < 0.4:
            return
        last_trigger_time = current_time
        
        stopped_something = False
        if state['is_recording']:
            stop_recording_backend()
            stopped_something = True
        if state['is_playing']:
            stop_playback_backend()
            stopped_something = True
        if stopped_something:
            print("[Emergency Stop] Triggered via hotkey:", active_hotkey)
            notify_js('onEmergencyStop')

def trigger_record_toggle():
    # Only toggle recording if not playing
    global last_trigger_time
    current_time = time.time()
    if current_time - last_trigger_time < 0.4:
        return
    last_trigger_time = current_time
    
    if not state['is_playing']:
        print("[Record Toggle] Triggered via hotkey:", record_hotkey)
        notify_js('onHotkeyRecordToggle')

def start_hotkey_listener():
    global hotkey_listener, active_hotkey, record_hotkey
    print("[Hotkey Listener] Starting GlobalHotKeys listener...")
    if hotkey_listener:
        try:
            hotkey_listener.stop()
        except:
            pass
            
    parsed_stop = to_pynput_hotkey(active_hotkey)
    parsed_record = to_pynput_hotkey(record_hotkey)
    
    hotkey_map = {}
    if parsed_stop:
        hotkey_map[parsed_stop] = trigger_emergency_stop
    if parsed_record:
        hotkey_map[parsed_record] = trigger_record_toggle
        
    try:
        hotkey_listener = keyboard.GlobalHotKeys(hotkey_map)
        hotkey_listener.start()
        print(f"[Hotkey Listener] GlobalHotKeys started successfully. Stop: {parsed_stop}, Record: {parsed_record}")
    except Exception as e:
        print(f"[Hotkey Listener] ERROR starting GlobalHotKeys listener: {e}")

def stop_recording_backend():
    global recorder, state
    if not state['is_recording']:
        return []
    state['is_recording'] = False
    events = recorder.stop()
    return events

def stop_playback_backend():
    global player, state
    if not state['is_playing']:
        return
    state['is_playing'] = False
    state['current_loop'] = 0
    player.stop()

# Pywebview API Class
class Api:
    def start_recording(self, record_mouse_moves=True):
        global recorder, state
        if state['is_playing'] or state['is_recording']:
            return False
        state['is_recording'] = True
        
        def event_callback(event):
            details_copy = event['details'].copy()
            notify_js('onNewEvent', {
                'time': event['time'],
                'type': event['type'],
                'details': details_copy
            })

        recorder = MacroRecorder(on_event_callback=event_callback, record_mouse_moves=record_mouse_moves)
        recorder.start()
        return True

    def stop_recording(self):
        global state
        if not state['is_recording']:
            return []
        return stop_recording_backend()

    def start_playback(self, events, loop_count, speed, delay_type, fixed_delay):
        global player, state
        if state['is_playing'] or state['is_recording']:
            return False
        state['is_playing'] = True
        
        def state_callback(status, loop):
            global state
            if status == 'playing':
                state['is_playing'] = True
                state['current_loop'] = loop
                # Pywebview safe calls to JS (passing list matches onPlaybackStateChange parameters)
                notify_js('onPlaybackStateChangeWrapper', [status, loop])
            else:
                state['is_playing'] = False
                state['current_loop'] = 0
                notify_js('onPlaybackStateChangeWrapper', [status, 0])

        speed_val = speed
        if speed != 'instant':
            try:
                speed_val = float(speed)
            except ValueError:
                speed_val = 1.0

        try:
            fixed_delay_ms = int(fixed_delay)
        except ValueError:
            fixed_delay_ms = 100

        player = MacroPlayer(on_state_change=state_callback)
        player.start(events, loop_count, speed_multiplier=speed_val, delay_override=delay_type, fixed_delay_ms=fixed_delay_ms)
        return True

    def stop_playback(self):
        global state
        if not state['is_playing']:
            return False
        stop_playback_backend()
        return True

    def update_hotkey(self, hotkey_str):
        global active_hotkey
        active_hotkey = hotkey_str
        print(f"Stop hotkey updated to: {active_hotkey}")
        start_hotkey_listener()
        return True

    def update_record_hotkey(self, hotkey_str):
        global record_hotkey
        record_hotkey = hotkey_str
        print(f"Record hotkey updated to: {record_hotkey}")
        start_hotkey_listener()
        return True

    def open_url(self, url):
        try:
            webbrowser.open(url)
            return True
        except Exception as e:
            print(f"Error opening URL: {e}")
            return False

    def save_macro(self, macro_name, events):
        try:
            os.makedirs('macros', exist_ok=True)
            safe_name = "".join([c for c in macro_name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
            if not safe_name:
                safe_name = "macro"
            filepath = os.path.join('macros', f"{safe_name}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump({
                    'name': macro_name,
                    'events': events
                }, f, indent=4)
            return {"success": True, "filename": f"{safe_name}.json"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def load_macro(self, filename):
        try:
            filepath = os.path.join('macros', filename)
            if not os.path.exists(filepath):
                return {"success": False, "error": "File does not exist"}
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {"success": True, "data": data}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_saved_macros(self):
        try:
            if not os.path.exists('macros'):
                return []
            files = [f for f in os.listdir('macros') if f.endswith('.json')]
            return files
        except Exception:
            return []

    def delete_macro(self, filename):
        try:
            filepath = os.path.join('macros', filename)
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Deleted macro: {filename}")
                return True
            return False
        except Exception as e:
            print(f"Error deleting macro: {e}")
            return False

if __name__ == '__main__':
    start_hotkey_listener()
    
    # Initialize API
    api = Api()
    
    # Create webview window
    # Points to local index.html resolved dynamically for PyInstaller bundles
    window_url = get_resource_path('web/index.html')
    window = webview.create_window(
        title='Macroxy Desktop Automation',
        url=window_url,
        js_api=api,
        width=1010,
        height=780,
        resizable=True
    )
    
    # Start webview loop
    webview.start()
