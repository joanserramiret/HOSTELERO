@echo off
chcp 65001 >nul
title HOSTELERO - Demo
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   ============================================================
  echo    HOSTELERO necesita Node.js para arrancar ^(es gratis^).
  echo    No esta instalado en este equipo.
  echo.
  echo    Abriendo la pagina de descarga...
  echo    Instala la version LTS, reinicia el equipo
  echo    y vuelve a ejecutar este archivo.
  echo   ============================================================
  echo.
  start "" https://nodejs.org/es
  pause
  exit /b
)

echo.
echo   ============================================================
echo    HOSTELERO se esta iniciando...
echo    Se abrira solo el navegador en unos segundos.
echo.
echo    NO cierres esta ventana mientras uses la demo.
echo    Para parar la demo, cierra esta ventana.
echo   ============================================================
echo.

start "" cmd /c "timeout /t 3 >nul & start http://localhost:7870"
node server.cjs
pause
