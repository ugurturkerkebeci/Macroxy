// pywebview compatibility layer
let pywebviewReady = false;
const eelCallsQueue = [];

// Mock Eel namespace to forward calls to pywebview with full parameters
window.eel = {
    start_recording: (recordMouseMoves) => (cb) => executePyCall('start_recording', [recordMouseMoves], cb),
    stop_recording: () => (cb) => executePyCall('stop_recording', [], cb),
    start_playback: (events, loops, speed, delayType, fixedDelay) => (cb) => executePyCall('start_playback', [events, loops, speed, delayType, fixedDelay], cb),
    stop_playback: () => (cb) => executePyCall('stop_playback', [], cb),
    update_hotkey: (hotkey) => (cb) => executePyCall('update_hotkey', [hotkey], cb),
    update_record_hotkey: (hotkey) => (cb) => executePyCall('update_record_hotkey', [hotkey], cb),
    save_macro: (name, events) => (cb) => executePyCall('save_macro', [name, events], cb),
    load_macro: (filename) => (cb) => executePyCall('load_macro', [filename], cb),
    get_saved_macros: () => (cb) => executePyCall('get_saved_macros', [], cb),
    delete_macro: (filename) => (cb) => executePyCall('delete_macro', [filename], cb),
    expose: (func) => {}
};

// Helper to execute Python API calls when ready
function executePyCall(method, args, callback) {
    if (pywebviewReady) {
        window.pywebview.api[method](...args).then(callback);
    } else {
        eelCallsQueue.push({ method, args, callback });
    }
}

// Signal that pywebview is loaded and execute queued actions
window.addEventListener('pywebviewready', () => {
    pywebviewReady = true;
    while (eelCallsQueue.length > 0) {
        const call = eelCallsQueue.shift();
        window.pywebview.api[call.method](...call.args).then(call.callback);
    }
});

// Helper for onPlaybackStateChange wrapper (receives data as array from python json serialization)
window.onPlaybackStateChangeWrapper = function(args) {
    if (Array.isArray(args) && args.length === 2) {
        onPlaybackStateChange(args[0], args[1]);
    }
};

// Global State Variables
let currentLang = 'en';
let recordedEvents = [];
let isRecording = false;
let isPlaying = false;
let stopHotkey = 'esc';
let recordHotkey = 'ctrl+alt+r';
let currentPlayingLoop = 0;

// Speed slider to multiplier mapping
const speedMap = {
    0: '0.5',
    1: '1.0',
    2: '1.5',
    3: '2.0',
    4: '3.0',
    5: '5.0',
    6: 'instant'
};

// Localization Dictionaries
const locales = {
    en: {
        statusIdle: "STANDBY",
        statusRecording: "RECORDING",
        statusPlaying: "REPLAYING",
        controlsTitle: "TACTICAL CONTROLS",
        record: "RECORD",
        recording: "RECORDING...",
        stop: "STOP",
        play: "PLAYBACK",
        playing: "PLAYBACK ACTIVE",
        settingsTitle: "PARAMETER CONFIG",
        recordMouseLabel: "Record Hover Moves",
        recordMouseDesc: "Turn off for clean, click-only macros",
        delayModeLabel: "Delay Calculation",
        delayOptOriginal: "Original Recorded Delays",
        delayOptFixed: "Fixed Intervals",
        fixedDelayLabel: "Fixed Inter-Delay (ms)",
        speedLabel: "Playback Speed",
        loopCountLabel: "Loop Repeats",
        loopCountDesc: "(0 = Continuous)",
        recordHotkeyLabel: "Record Hotkey",
        stopHotkeyLabel: "Emergency Stop Key",
        saveMacroTitle: "COMMIT MACRO",
        macroNamePlaceholder: "MACRO_KEY_NAME",
        saveBtn: "COMMIT TO STORAGE",
        timelineTitle: "EVENT FEED CONSOLE",
        eventsCountLabel: "EVT",
        clearBtn: "[WIPE]",
        noEventsText: "Awaiting command. Press record hotkey to capture mouse actions, key strikes, or window focuses.",
        libraryTitle: "MACRO STORAGE BANKS",
        helpTitle: "Macroxy Operations Guide",
        helpRecordTitle: "1. Recording Macros",
        helpRecordText: "Click the red Record button or press your global Record Hotkey. The app window will focus out and start capturing all your mouse clicks, scrolls, keyboard inputs, and active window changes. Press the global Record Hotkey again to stop recording.",
        helpPlayTitle: "2. Replaying Macros",
        helpPlayText: "Once recorded, you can specify speed multipliers (0.5x up to Instant) or fixed delays (e.g. 100ms between actions). Select the loop count and click Play. Press the Emergency Stop Key (Default: ESC) to abort playback instantly from any screen.",
        helpHotkeyTitle: "3. Customizing Hotkeys",
        helpHotkeyText: "Click on the Hotkey buttons in settings. Press any key combination (like Ctrl+Shift+S or F12) to bind it as the new trigger. Bindings are saved globally.",
        helpSaveTitle: "4. Macro Storage",
        helpSaveText: "Save your timeline macros using name keys. Loaded files instantly update your active event feed ready for playback or loop adjustments.",
        
        btnLoad: "LOAD",
        btnDelete: "WIPE",
        itemsText: "events",
        loopsText: "loops",
        tabGuide: "OPERATIONS GUIDE",
        tabAbout: "ABOUT SYSTEM",
        developerLabel: "Developer:",
        licenseLabel: "License:",
        aboutDesc: "Macroxy is a high-precision macro automation utility developed by Uğur Türker Kebeci. Released as open source under the MIT License, compatible with Windows 7 and above.",
        githubBtnText: "GITHUB PROFILE",
        toastHotkeyCapturing: "BINDING: Press key combination...",
        toastHotkeyCanceled: "Hotkey binding cancelled",
        toastSavedSuccess: "Macro committed to storage bank",
        toastLoadSuccess: "Macro loaded successfully!",
        toastTimelineCleared: "Timeline feed wiped clean",
        toastRecordingStarted: "REC active: Listening to OS inputs...",
        toastRecordingStopped: "REC ended: {count} events captured.",
        toastPlaybackStarted: "PLAY active: Simulating inputs...",
        toastPlaybackFinished: "PLAY complete: Sequence finished.",
        toastEmergencyStop: "ABORT: Emergency stop triggered!",
        toastErrorEmptyName: "Input error: macro name cannot be empty",
        toastErrorNoEvents: "Execution error: timeline stack is empty"
    },
    tr: {
        statusIdle: "BEKLEMEDE",
        statusRecording: "KAYITTA",
        statusPlaying: "OYNATILIYOR",
        controlsTitle: "KONTROL PANELİ",
        record: "KAYDET",
        recording: "KAYDEDİLİYOR...",
        stop: "DURDUR",
        play: "OYNAT",
        playing: "OYNATMA AKTİF",
        settingsTitle: "PARAMETRE AYARLARI",
        recordMouseLabel: "Fare Hareketlerini Kaydet",
        recordMouseDesc: "Daha temiz ve hızlı makrolar için kapatın",
        delayModeLabel: "Bekleme Hesaplama",
        delayOptOriginal: "Orijinal Kayıt Gecikmeleri",
        delayOptFixed: "Sabit Zaman Aralığı",
        fixedDelayLabel: "Sabit Bekleme Süresi (ms)",
        speedLabel: "Oynatma Hızı",
        loopCountLabel: "Döngü Sayısı",
        loopCountDesc: "(Sonsuz için 0)",
        recordHotkeyLabel: "Kayıt Kısayolu",
        stopHotkeyLabel: "Acil Durdurma Tuşu",
        saveMacroTitle: "MAKROYU KAYDET",
        macroNamePlaceholder: "MAKRO_ANAHTAR_ADI",
        saveBtn: "KÜTÜPHANEYE KAYDET",
        timelineTitle: "EYLEM AKIŞ KONSOLU",
        eventsCountLabel: "EYL",
        clearBtn: "[TEMİZLE]",
        noEventsText: "Komut bekleniyor. Fare hareketlerini, tuş vuruşlarını veya pencere odaklarını yakalamak için kayıt kısayoluna basın.",
        libraryTitle: "MAKRO DEPOLAMA BANKALARI",
        helpTitle: "Macroxy Kullanım Klavuzu",
        helpRecordTitle: "1. Makro Kaydetme",
        helpRecordText: "Kırmızı Kaydet butonuna veya global Kayıt Kısayolunuza basın. Uygulama arka plana geçerek fare tıklamalarınızı, tekerlek hareketlerini, klavye girdilerini ve aktif pencere değişikliklerini kaydeder. Kaydı durdurmak için kısayola tekrar basın.",
        helpPlayTitle: "2. Makroyu Oynatma",
        helpPlayText: "Kaydedildikten sonra hız çarpanlarını (0.5x - Instant) veya sabit gecikmeleri (örn. 100ms) belirtebilirsiniz. Döngü sayısını seçip Oynat'a basın. Herhangi bir ekrandan anında durdurmak için Acil Durdurma Tuşuna (Varsayılan: ESC) basın.",
        helpHotkeyTitle: "3. Kısayol Değiştirme",
        helpHotkeyText: "Ayarlardaki Kısayol butonlarına tıklayın. Atamak istediğiniz tuş kombinasyonuna (Ctrl+Shift+S veya F12 gibi) basın. Tuş kombinasyonları kaydedilecektir.",
        helpSaveTitle: "4. Makro Depolama",
        helpSaveText: "Zaman çizelgesi makrolarınızı adlandırarak kaydedin. Yüklenen dosyalar eylem akışınızı günceller ve oynatmaya hazır hale getirir.",
        
        btnLoad: "YÜKLE",
        btnDelete: "SİL",
        itemsText: "eylem",
        loopsText: "döngü",
        tabGuide: "KULLANIM REHBERİ",
        tabAbout: "SİSTEM HAKKINDA",
        developerLabel: "Geliştirici:",
        licenseLabel: "Lisans:",
        aboutDesc: "Macroxy, Uğur Türker Kebeci tarafından geliştirilmiş yüksek hassasiyetli bir makro otomasyon aracıdır. MIT Lisansı altında açık kaynaklı olarak yayınlanmıştır ve Windows 7 ve üzeriyle uyumludur.",
        githubBtnText: "GITHUB PROFİLİ",
        toastHotkeyCapturing: "ATAMA: Tuş kombinasyonuna basın...",
        toastHotkeyCanceled: "Kısayol ataması iptal edildi",
        toastSavedSuccess: "Makro depolama bankasına kaydedildi",
        toastLoadSuccess: "Makro başarıyla yüklendi!",
        toastTimelineCleared: "Zaman çizelgesi akışı temizlendi",
        toastRecordingStarted: "KAYIT aktif: Girdiler dinleniyor...",
        toastRecordingStopped: "KAYIT durduruldu. {count} eylem yakalandı.",
        toastPlaybackStarted: "OYNATMA aktif: Simülasyon başladı...",
        toastPlaybackFinished: "OYNATMA tamamlandı: Dizi bitirildi.",
        toastEmergencyStop: "İPTAL: Acil durdurma tetiklendi!",
        toastErrorEmptyName: "Girdi hatası: makro adı boş bırakılamaz",
        toastErrorNoEvents: "Çalıştırma hatası: zaman çizelgesi boş"
    }
};

// Tactical Boot Sequence Simulation Logs
const bootLogs = [
    "[BOOT] Initializing Macroxy core modules...",
    "[BOOT] Loading keyboard hook controller...",
    "[BOOT] Loading mouse listener hooks...",
    "[BOOT] Loading active window ctypes listener...",
    "[BOOT] Resolving Windows system locale settings...",
    "[BOOT] Native WebView2 container loaded: OK",
    "[BOOT] Standard socket resolution monkey patches: ACTIVE",
    "[BOOT] Global keyboard shortcut triggers: ACTIVE",
    "[BOOT] System status: STANDBY / READY TO OPERATE",
    ""
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Run Splash Boot Animation
    runBootSequence(() => {
        // Load Settings from LocalStorage
        loadPersistedSettings();
        
        // Fetch macros library
        refreshLibrary();
    });
});

// Boot Sequence Simulation Logic
function runBootSequence(onComplete) {
    const textDiv = document.getElementById('bootText');
    const progBar = document.getElementById('bootProgress');
    let lineIdx = 0;
    
    function printNextLine() {
        if (lineIdx < bootLogs.length) {
            textDiv.innerText += bootLogs[lineIdx] + "\n";
            textDiv.scrollTop = textDiv.scrollHeight;
            
            // Progress Bar scale
            const percent = ((lineIdx + 1) / bootLogs.length) * 100;
            progBar.style.width = percent + "%";
            
            lineIdx++;
            setTimeout(printNextLine, 140);
        } else {
            // Boot complete, fade out splash screen
            setTimeout(() => {
                const splash = document.getElementById('splashScreen');
                splash.style.opacity = 0;
                setTimeout(() => {
                    splash.style.display = 'none';
                    if (onComplete) onComplete();
                }, 400);
            }, 300);
        }
    }
    
    printNextLine();
}

// Load configurations from local storage
function loadPersistedSettings() {
    const savedLang = localStorage.getItem('macroxy_lang') || 'en';
    setLanguage(savedLang);

    // Record Mouse Moves Switch
    const savedMouseMoves = localStorage.getItem('macroxy_record_mouse');
    if (savedMouseMoves !== null) {
        document.getElementById('recordMouseMovesInput').checked = (savedMouseMoves === 'true');
    }

    // Delay Override Mode
    const savedDelayMode = localStorage.getItem('macroxy_delay_mode') || 'original';
    document.getElementById('delayModeSelect').value = savedDelayMode;
    toggleFixedDelayInput();

    // Fixed Delay Value
    const savedFixedDelay = localStorage.getItem('macroxy_fixed_delay') || '100';
    document.getElementById('fixedDelayInput').value = savedFixedDelay;

    // Playback Speed Slider
    const savedSpeedIndex = localStorage.getItem('macroxy_speed_index') || '1'; // 1.0x default
    document.getElementById('speedRange').value = savedSpeedIndex;
    updateSpeedBadge(savedSpeedIndex);

    // Loop Count Repeats
    const savedLoops = localStorage.getItem('macroxy_loops') || '1';
    document.getElementById('loopCountInput').value = savedLoops;

    // Hotkeys binding display and backend sync
    const savedStopKey = localStorage.getItem('macroxy_stop_key') || 'ESC';
    stopHotkey = savedStopKey.toLowerCase();
    document.getElementById('hotkeyBtn').innerText = savedStopKey.toUpperCase();
    eel.update_hotkey(stopHotkey)(() => {});
    
    const savedRecordKey = localStorage.getItem('macroxy_record_key') || 'CTRL+ALT+R';
    recordHotkey = savedRecordKey.toLowerCase();
    document.getElementById('recordHotkeyBtn').innerText = savedRecordKey.toUpperCase();
    eel.update_record_hotkey(recordHotkey)(() => {});
}

// Save configurations to local storage
function persistConfig(key, val) {
    localStorage.setItem(key, val);
}

// Show/Hide Fixed Delay parameter input group
function toggleFixedDelayInput() {
    const select = document.getElementById('delayModeSelect');
    const group = document.getElementById('fixedDelayInputGroup');
    if (select.value === 'fixed') {
        group.style.display = 'flex';
    } else {
        group.style.display = 'none';
    }
    persistConfig('macroxy_delay_mode', select.value);
}

// Update UI speed text badge based on slider input index
function updateSpeedBadge(val) {
    const badge = document.getElementById('speedValueTag');
    const multiplier = speedMap[val];
    if (multiplier === 'instant') {
        badge.innerText = locales[currentLang] ? (currentLang === 'en' ? 'Instant' : 'Gecikmesiz') : 'Instant';
    } else {
        badge.innerText = multiplier + "x";
    }
    persistConfig('macroxy_speed_index', val);
}

// Adjust loop count buttons
function adjustLoop(amount) {
    const input = document.getElementById('loopCountInput');
    let current = parseInt(input.value) || 0;
    let nextValue = current + amount;
    if (nextValue < 0) nextValue = 0;
    input.value = nextValue;
    persistConfig('macroxy_loops', nextValue);
}

// Localization Engine
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('macroxy_lang', lang);
    
    document.getElementById('langEn').classList.toggle('active', lang === 'en');
    document.getElementById('langTr').classList.toggle('active', lang === 'tr');
    
    const elements = document.querySelectorAll('[data-localize]');
    elements.forEach(el => {
        const key = el.getAttribute('data-localize');
        if (locales[lang][key]) {
            if (key === 'statusPlaying' && isPlaying) {
                el.innerText = formatPlayingString();
            } else {
                el.innerText = locales[lang][key];
            }
        }
    });

    const inputs = document.querySelectorAll('[data-placeholder-localize]');
    inputs.forEach(el => {
        const key = el.getAttribute('data-placeholder-localize');
        if (locales[lang][key]) {
            el.setAttribute('placeholder', locales[lang][key]);
        }
    });

    // Update speed badge text representation
    updateSpeedBadge(document.getElementById('speedRange').value);
    
    renderTimelineFeed();
    refreshLibrary();
}

function formatPlayingString() {
    const loopVal = document.getElementById('loopCountInput').value;
    const total = loopVal == 0 ? '∞' : loopVal;
    if (currentLang === 'tr') {
        return `OYNATILIYOR (DÖNGÜ ${currentPlayingLoop}/${total})`;
    }
    return `PLAYBACK (LOOP ${currentPlayingLoop}/${total})`;
}

// Show/Hide Modal Guides
function toggleHelpModal() {
    document.getElementById('helpModal').classList.toggle('show');
}

function closeHelpModalOutside(e) {
    const modal = document.getElementById('helpModal');
    if (e.target === modal) {
        modal.classList.remove('show');
    }
}

// Toast Messages
function showToast(message, isAlert = false) {
    const toast = document.getElementById('appToast');
    const toastMsg = toast.querySelector('.toast-message');
    toastMsg.innerText = message;
    
    if (isAlert) {
        toast.style.borderColor = 'var(--warning-red)';
        toast.style.borderLeftColor = 'var(--warning-red)';
    } else {
        toast.style.borderColor = 'var(--amber)';
        toast.style.borderLeftColor = 'var(--amber)';
    }
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Toggle Recording State
function toggleRecording() {
    if (isPlaying) return;
    
    if (isRecording) {
        // Stop recording
        eel.stop_recording()(function(events) {
            isRecording = false;
            document.body.classList.remove('recording-active');
            updateAppStatus('idle');
            recordedEvents = events;
            
            if (recordedEvents && recordedEvents.length > 0) {
                document.getElementById('saveCard').style.display = 'block';
                document.getElementById('clearTimelineBtn').style.display = 'inline-block';
            }
            
            renderTimelineFeed();
            const msg = locales[currentLang].toastRecordingStopped.replace('{count}', recordedEvents.length);
            showToast(msg);
        });
    } else {
        // Start recording
        recordedEvents = [];
        renderTimelineFeed();
        document.getElementById('saveCard').style.display = 'none';
        document.getElementById('clearTimelineBtn').style.display = 'none';

        const recordMouseMoves = document.getElementById('recordMouseMovesInput').checked;
        persistConfig('macroxy_record_mouse', recordMouseMoves);

        eel.start_recording(recordMouseMoves)(function(success) {
            if (success) {
                isRecording = true;
                document.body.classList.add('recording-active');
                updateAppStatus('recording');
                showToast(locales[currentLang].toastRecordingStarted);
            }
        });
    }
}

// Realtime Recording Event Listener
function onNewEvent(event) {
    recordedEvents.push(event);
    renderTimelineFeed();
}

// Python Keyboard hotkey trigger: acts as if record key is pressed
function onHotkeyRecordToggle() {
    toggleRecording();
}

// Global Stop Callback
function onEmergencyStop() {
    isRecording = false;
    isPlaying = false;
    currentPlayingLoop = 0;
    
    document.body.classList.remove('recording-active');
    document.body.classList.remove('playing-active');
    document.getElementById('playBtn').disabled = false;
    
    updateAppStatus('idle');
    showToast(locales[currentLang].toastEmergencyStop, true);
    
    if (recordedEvents.length === 0) {
        eel.stop_recording()(function(events) {
            if (events && events.length > 0) {
                recordedEvents = events;
                document.getElementById('saveCard').style.display = 'block';
                document.getElementById('clearTimelineBtn').style.display = 'inline-block';
                renderTimelineFeed();
            }
        });
    }
}

// Status text mapping
function updateAppStatus(statusState) {
    const container = document.getElementById('appStatus');
    const textSpan = container.querySelector('.status-text');
    
    container.className = 'status-indicator';
    
    if (statusState === 'idle') {
        textSpan.innerText = locales[currentLang].statusIdle;
    } else if (statusState === 'recording') {
        container.classList.add('recording-active');
        textSpan.innerText = locales[currentLang].statusRecording;
    } else if (statusState === 'playing') {
        container.classList.add('playing-active');
        textSpan.innerText = formatPlayingString();
    }
}

// Playback Control Handlers
function togglePlayback() {
    if (isRecording) return;
    
    if (isPlaying) {
        eel.stop_playback()(function() {
            isPlaying = false;
            currentPlayingLoop = 0;
            document.body.classList.remove('playing-active');
            updateAppStatus('idle');
        });
    } else {
        if (!recordedEvents || recordedEvents.length === 0) {
            showToast(locales[currentLang].toastErrorNoEvents, true);
            return;
        }
        
        const loops = parseInt(document.getElementById('loopCountInput').value) || 0;
        
        // Collect advanced parameters
        const speedIdx = document.getElementById('speedRange').value;
        const speedVal = speedMap[speedIdx];
        
        const delayType = document.getElementById('delayModeSelect').value;
        const fixedDelay = document.getElementById('fixedDelayInput').value;

        // Persist loop configuration
        persistConfig('macroxy_loops', loops);

        eel.start_playback(recordedEvents, loops, speedVal, delayType, fixedDelay)(function(success) {
            if (success) {
                isPlaying = true;
                currentPlayingLoop = 1;
                document.body.classList.add('playing-active');
                updateAppStatus('playing');
                showToast(locales[currentLang].toastPlaybackStarted);
            }
        });
    }
}

function onPlaybackStateChange(statusState, currentLoop) {
    if (statusState === 'playing') {
        isPlaying = true;
        currentPlayingLoop = currentLoop;
        updateAppStatus('playing');
    } else {
        isPlaying = false;
        currentPlayingLoop = 0;
        document.body.classList.remove('playing-active');
        updateAppStatus('idle');
        showToast(locales[currentLang].toastPlaybackFinished);
    }
}

// Event Feed Console rendering
function renderTimelineFeed() {
    const feed = document.getElementById('timelineFeed');
    const emptyState = document.getElementById('emptyTimelineState');
    const countTag = document.getElementById('eventCountTag');
    
    const items = feed.querySelectorAll('.timeline-item');
    items.forEach(item => item.remove());
    
    countTag.innerText = `${recordedEvents.length} ${locales[currentLang].eventsCountLabel}`;

    if (!recordedEvents || recordedEvents.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Limits visible stream to prevent lag (console format)
    const maxVisible = 100;
    const startIndex = Math.max(0, recordedEvents.length - maxVisible);
    
    for (let i = startIndex; i < recordedEvents.length; i++) {
        const ev = recordedEvents[i];
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        let typeClass = 'move';
        let logText = '';
        
        if (ev.type === 'window_change') {
            typeClass = 'window';
            logText = `[SYS] Focus Switch -> "${ev.details.title}"`;
        } else if (ev.type === 'mouse_click') {
            typeClass = 'click';
            const stateText = ev.details.pressed ? 'DOWN' : 'UP';
            logText = `[MSE] Click -> ${ev.details.button.toUpperCase()} (${stateText}) at x:${ev.details.x}, y:${ev.details.y}`;
        } else if (ev.type === 'mouse_scroll') {
            typeClass = 'scroll';
            logText = `[MSE] Scroll -> dx:${ev.details.dx}, dy:${ev.details.dy} at x:${ev.details.x}, y:${ev.details.y}`;
        } else if (ev.type === 'key_press') {
            typeClass = 'keyboard';
            logText = `[KBD] Key Stroke -> [${ev.details.key.toUpperCase()}] (DOWN)`;
        } else if (ev.type === 'key_release') {
            typeClass = 'keyboard';
            logText = `[KBD] Key Stroke -> [${ev.details.key.toUpperCase()}] (UP)`;
        } else if (ev.type === 'mouse_move') {
            typeClass = 'move';
            logText = `[MSE] Cursor Move -> x:${ev.details.x}, y:${ev.details.y}`;
        }

        item.classList.add(typeClass);
        item.innerHTML = `
            <div class="item-details">
                <div class="item-title">${logText}</div>
                <div class="item-time">${formatTimeMs(ev.time)}</div>
            </div>
        `;
        feed.appendChild(item);
    }
    
    feed.scrollTop = feed.scrollHeight;
}

function formatTimeMs(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function clearTimeline() {
    recordedEvents = [];
    renderTimelineFeed();
    document.getElementById('saveCard').style.display = 'none';
    document.getElementById('clearTimelineBtn').style.display = 'none';
    showToast(locales[currentLang].toastTimelineCleared);
}

// Storage Commit logic
function saveCurrentMacro() {
    const input = document.getElementById('macroNameInput');
    const name = input.value.trim();
    
    if (!name) {
        showToast(locales[currentLang].toastErrorEmptyName, true);
        return;
    }
    
    if (!recordedEvents || recordedEvents.length === 0) {
        showToast(locales[currentLang].toastErrorNoEvents, true);
        return;
    }
    
    eel.save_macro(name, recordedEvents)(function(res) {
        if (res.success) {
            showToast(locales[currentLang].toastSavedSuccess);
            input.value = '';
            refreshLibrary();
        } else {
            showToast(res.error, true);
        }
    });
}

function refreshLibrary() {
    eel.get_saved_macros()(function(files) {
        const grid = document.getElementById('libraryGrid');
        grid.innerHTML = '';
        
        if (!files || files.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; height: 60px;">
                <p style="font-size: 11px;">[ EMPTY STORAGE BANKS ]</p>
            </div>`;
            return;
        }
        
        files.forEach(file => {
            eel.load_macro(file)(function(res) {
                if (res.success) {
                    const item = document.createElement('div');
                    item.className = 'library-item';
                    
                    const mName = res.data.name;
                    const mCount = res.data.events.length;
                    
                    item.innerHTML = `
                        <div class="lib-info">
                            <div class="lib-name">${mName}</div>
                            <div class="lib-meta">${mCount} ${locales[currentLang].itemsText}</div>
                        </div>
                        <div class="lib-actions">
                            <button class="lib-btn lib-load" onclick="loadLibraryMacro('${file}')">${locales[currentLang].btnLoad}</button>
                            <button class="lib-btn lib-delete" onclick="deleteLibraryMacro('${file}')">${locales[currentLang].btnDelete}</button>
                        </div>
                    `;
                    grid.appendChild(item);
                }
            });
        });
    });
}

function loadLibraryMacro(filename) {
    eel.load_macro(filename)(function(res) {
        if (res.success) {
            recordedEvents = res.data.events;
            renderTimelineFeed();
            document.getElementById('saveCard').style.display = 'block';
            document.getElementById('clearTimelineBtn').style.display = 'inline-block';
            showToast(locales[currentLang].toastLoadSuccess);
        } else {
            showToast(res.error, true);
        }
    });
}

function deleteLibraryMacro(filename) {
    eel.delete_macro(filename)(function(success) {
        if (success) {
            refreshLibrary();
            showToast(currentLang === 'en' ? 'Macro deleted from bank' : 'Makro bankadan silindi');
        } else {
            showToast(currentLang === 'en' ? 'Delete failed' : 'Silme başarısız', true);
        }
    });
}

// Hotkey Assignment Capture Logic
let keydownHandler = null;

function startHotkeyCapture(targetType) {
    if (isRecording || isPlaying) return;
    
    const btnId = (targetType === 'record') ? 'recordHotkeyBtn' : 'hotkeyBtn';
    const btn = document.getElementById(btnId);
    btn.classList.add('capturing');
    btn.innerText = locales[currentLang].toastHotkeyCapturing;
    
    showToast(locales[currentLang].toastHotkeyCapturing);
    
    if (keydownHandler) {
        window.removeEventListener('keydown', keydownHandler);
    }
    
    keydownHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Escape alone cancels hotkey configuration
        if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            btn.classList.remove('capturing');
            const prevVal = (targetType === 'record') ? recordHotkey : stopHotkey;
            btn.innerText = prevVal.toUpperCase();
            showToast(locales[currentLang].toastHotkeyCanceled);
            window.removeEventListener('keydown', keydownHandler);
            keydownHandler = null;
            return;
        }
        
        let parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('cmd');
        
        const key = e.key.toLowerCase();
        
        // Check if non-modifier key pressed
        if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
            let pynputKey = key;
            if (key === 'escape') pynputKey = 'esc';
            else if (key === 'arrowup') pynputKey = 'up';
            else if (key === 'arrowdown') pynputKey = 'down';
            else if (key === 'arrowleft') pynputKey = 'left';
            else if (key === 'arrowright') pynputKey = 'right';
            else if (key === ' ') pynputKey = 'space';
            else if (key === 'enter') pynputKey = 'enter';
            else if (key === 'backspace') pynputKey = 'backspace';
            else if (key === 'tab') pynputKey = 'tab';
            else if (key === 'delete') pynputKey = 'delete';
            else if (key === 'insert') pynputKey = 'insert';
            
            parts.push(pynputKey);
            const finalHotkey = parts.join('+');
            
            if (targetType === 'record') {
                recordHotkey = finalHotkey;
                eel.update_record_hotkey(finalHotkey)(function(success) {
                    if (success) {
                        btn.innerText = finalHotkey.toUpperCase();
                        btn.classList.remove('capturing');
                        persistConfig('macroxy_record_key', finalHotkey.toUpperCase());
                        showToast(currentLang === 'en' ? `Record hotkey: ${finalHotkey.toUpperCase()}` : `Kayıt kısayolu: ${finalHotkey.toUpperCase()}`);
                    }
                    window.removeEventListener('keydown', keydownHandler);
                    keydownHandler = null;
                });
            } else {
                stopHotkey = finalHotkey;
                eel.update_hotkey(finalHotkey)(function(success) {
                    if (success) {
                        btn.innerText = finalHotkey.toUpperCase();
                        btn.classList.remove('capturing');
                        persistConfig('macroxy_stop_key', finalHotkey.toUpperCase());
                        showToast(currentLang === 'en' ? `Stop hotkey: ${finalHotkey.toUpperCase()}` : `Durdurma kısayolu: ${finalHotkey.toUpperCase()}`);
                    }
                    window.removeEventListener('keydown', keydownHandler);
                    keydownHandler = null;
                });
            }
        }
    };
    
    window.addEventListener('keydown', keydownHandler);
}

// Tab switcher for help/about modal
window.switchModalTab = function(tabId) {
    const guideTab = document.getElementById('modalTabGuide');
    const aboutTab = document.getElementById('modalTabAbout');
    const btnGuide = document.getElementById('tabBtnGuide');
    const btnAbout = document.getElementById('tabBtnAbout');
    
    if (tabId === 'guide') {
        guideTab.style.display = 'block';
        aboutTab.style.display = 'none';
        btnGuide.classList.add('active');
        btnAbout.classList.remove('active');
    } else {
        guideTab.style.display = 'none';
        aboutTab.style.display = 'block';
        btnGuide.classList.remove('active');
        btnAbout.classList.add('active');
    }
};

// Trigger python API to open Uğur's GitHub profile in default system browser
window.openGithub = function() {
    executePyCall('open_url', ['https://github.com/ugurturkerkebeci'], (res) => {
        if (!res) {
            console.error("Failed to open browser URL");
        }
    });
};
