@echo off
chcp 65001 >nul
title HOSTELERO - Crear / actualizar kit de demo
cd /d "%~dp0"

set DEST=HOSTELERO-Demo
if not exist "%DEST%" mkdir "%DEST%"
if not exist "%DEST%\brand" mkdir "%DEST%\brand"

echo.
echo   Copiando los archivos reales de HOSTELERO al kit...
copy /Y server.cjs            "%DEST%\" >nul
copy /Y engine.js             "%DEST%\" >nul
copy /Y sync.js               "%DEST%\" >nul
copy /Y brand.js              "%DEST%\" >nul
copy /Y index.html            "%DEST%\" >nul
copy /Y HOSTELERO-TPV.html    "%DEST%\" >nul
copy /Y Comandera-Movil.html  "%DEST%\" >nul
copy /Y Cocina-KDS.html       "%DEST%\" >nul
copy /Y Admin.html            "%DEST%\" >nul
copy /Y Carta-Digital.html    "%DEST%\" >nul
copy /Y brand\*.svg           "%DEST%\brand\" >nul

echo   Comprimiendo HOSTELERO-Demo-kit.zip ...
powershell -NoProfile -Command "Compress-Archive -Path '%DEST%\*' -DestinationPath 'HOSTELERO-Demo-kit.zip' -Force"

echo.
echo   ============================================================
echo    LISTO. HOSTELERO-Demo-kit.zip actualizado con los archivos
echo    correctos de tu equipo (sin pasar por ningun sandbox).
echo   ============================================================
echo.
pause
