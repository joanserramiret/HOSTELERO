@echo off
title HOSTELERO - Servidor local
cd /d "%~dp0"
echo ==========================================================
echo    HOSTELERO - Servidor local  (WiFi, sin internet)
echo ==========================================================
echo.
echo  Manten esta ventana ABIERTA mientras uses el sistema.
echo  Para parar el servidor: cierra esta ventana o pulsa Ctrl+C.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] No se encuentra Node.js.
  echo  Instalalo desde https://nodejs.org  y vuelve a abrir este archivo.
  echo.
  pause
  exit /b
)
node server.cjs
echo.
echo  El servidor se ha detenido.
pause
