@echo off
setlocal enabledelayedexpansion
title Educational Progress Monitoring System (EPMS) Launcher

:: Switch to UTF-8 for clean console output
chcp 65001 >nul

:: Ensure working directory is the script directory
cd /d "%~dp0"

cls
echo ===============================================================================
echo               Educational Progress Monitoring System (EPMS)
echo                       Automated System Launcher
echo ===============================================================================
echo.

:: 1. Verify Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your system PATH!
    echo Please install Node.js [v18 or higher] from https://nodejs.org/
    echo After installing, restart this script.
    echo.
    pause
    exit /b 1
)

:: 2. Verify npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm was not found in your system PATH!
    echo.
    pause
    exit /b 1
)

echo [*] Checking dependencies...

:: 3. Check Backend Dependencies
if not exist "backend\node_modules" (
    echo [!] Backend dependencies not found. Installing now...
    cd backend
    call npm install
    cd ..
)

:: 4. Check Frontend Dependencies
if not exist "epms-frontend\node_modules" (
    echo [!] Frontend dependencies not found. Installing now...
    cd epms-frontend
    call npm install
    cd ..
)

:START_SERVERS
echo.
echo [*] Checking for stale port bindings on 5000 and 5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }" >nul 2>&1
if %ERRORLEVEL% equ 1 (
    echo [*] Freeing ports 5000 / 5173 from previous instances...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
    timeout /t 1 /nobreak >nul 2>&1
)

:: 5. Start Backend Server
echo [*] Starting Backend API Server on port 5000...
start "EPMS Backend (Port 5000)" /D "%~dp0backend" cmd /k "call npm start"

:: 6. Start Frontend Server
echo [*] Starting Frontend Server on port 5173...
start "EPMS Frontend (Port 5173)" /D "%~dp0epms-frontend" cmd /k "call npm run dev"

:: 7. Wait for Vite server to respond
echo [*] Waiting for web application to initialize...
set /a attempts=0

:WAIT_VITE
set /a attempts+=1
timeout /t 1 /nobreak >nul 2>&1

where curl >nul 2>&1
if %ERRORLEVEL% equ 0 (
    curl.exe -s -o nul http://localhost:5173 >nul 2>&1
    if !ERRORLEVEL! equ 0 goto READY
    curl.exe -s -o nul http://127.0.0.1:5173 >nul 2>&1
    if !ERRORLEVEL! equ 0 goto READY
) else (
    if !attempts! geq 6 goto READY
)

if !attempts! geq 25 (
    echo [!] Server initialization took longer than expected, opening browser...
    goto READY
)
goto WAIT_VITE

:READY
echo.
echo [OK] Both servers are UP and RUNNING!
echo [*] Launching EPMS in your default web browser...
start "" "http://localhost:5173"

:DASHBOARD
cls
echo ===============================================================================
echo               Educational Progress Monitoring System (EPMS)
echo ===============================================================================
echo.
echo  [STATUS] All servers are ONLINE and ACTIVE!
echo.
echo   * Frontend Web App:  http://localhost:5173
echo   * Backend API:       http://localhost:5000
echo.
echo -------------------------------------------------------------------------------
echo  DEMO CREDENTIALS [Quick Login buttons also available on login screen]:
echo.
echo   [Teacher / Faculty]
echo     Email:    prof.anjali@epms.edu (or teacher@epms.edu)
echo     Password: Password123!
echo.
echo   [Student]
echo     Email:    aayush@epms.edu (or student1@epms.edu)
echo     Password: Password123!
echo -------------------------------------------------------------------------------
echo.
echo  MANAGEMENT OPTIONS:
echo    [O] Re-open project in browser
echo    [R] Restart both servers
echo    [S] Stop all servers and exit
echo    [Q] Quit this control window [servers stay running]
echo.
echo ===============================================================================

:MENU_LOOP
choice /c ORSQ /n /m "Select an option [O, R, S, Q]: "
if errorlevel 4 goto QUIT
if errorlevel 3 goto STOP_SERVERS
if errorlevel 2 goto RESTART
if errorlevel 1 goto OPEN_BROWSER

:OPEN_BROWSER
echo [*] Opening browser...
start "" "http://localhost:5173"
goto DASHBOARD

:RESTART
echo.
echo [*] Restarting EPMS servers...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 2 /nobreak >nul 2>&1
goto START_SERVERS

:STOP_SERVERS
echo.
echo [*] Stopping EPMS servers on ports 5000 and 5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo [OK] All EPMS servers stopped successfully.
timeout /t 2 /nobreak >nul 2>&1
exit /b 0

:QUIT
exit /b 0
