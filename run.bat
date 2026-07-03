@echo off
:: Macroxy Launcher Script (Console Hidden)
:: Launches pythonw.exe in windowed mode and closes the command prompt instantly

setlocal
cd /d "%~dp0"

if not exist "myenv\Scripts\pythonw.exe" (
    echo [ERROR] Virtual environment 'myenv' with pythonw.exe not found!
    pause
    exit /b 1
)

:: Start pythonw.exe asynchronously and close this console window immediately
start "" "myenv\Scripts\pythonw.exe" app.py
endlocal
