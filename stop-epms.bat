@echo off
setlocal
title Stop EPMS Servers

chcp 65001 >nul
echo ===============================================================================
echo                 Stopping EPMS Backend and Frontend Servers
echo ===============================================================================
echo.
echo [*] Terminating processes running on Port 5000 (Backend) and Port 5173 (Frontend)...

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { $proc = Get-Process -Id $_ -ErrorAction SilentlyContinue; if ($proc) { Write-Host 'Killing process:' $proc.ProcessName '(PID:' $_ ')'; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"

echo.
echo [OK] All EPMS servers stopped successfully!
echo Ports 5000 and 5173 are now free.
echo.
timeout /t 3 >nul 2>&1
exit /b 0
