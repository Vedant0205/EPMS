@echo off
setlocal
title Create EPMS Desktop Shortcut

chcp 65001 >nul
echo ===============================================================================
echo                Create Desktop Shortcut for EPMS Launcher
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); if (-not $desktop -or -not (Test-Path $desktop)) { $desktop = Join-Path $env:USERPROFILE 'Desktop' }; if (-not (Test-Path $desktop)) { Write-Host '[!] Could not find Desktop folder, creating shortcut in project folder instead.'; $desktop = '%~dp0' }; $shortcutPath = Join-Path $desktop 'EPMS.lnk'; $shortcut = $ws.CreateShortcut($shortcutPath); $shortcut.TargetPath = Join-Path '%~dp0' 'start-epms.bat'; $shortcut.WorkingDirectory = '%~dp0'; $shortcut.Description = 'Start Educational Progress Monitoring System'; $shortcut.IconLocation = 'shell32.dll,13'; $shortcut.Save(); Write-Host '[OK] Desktop shortcut created successfully at:' $shortcutPath -ForegroundColor Green"

echo.
pause
