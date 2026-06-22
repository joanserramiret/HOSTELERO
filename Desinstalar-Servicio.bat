@echo off
title HOSTELERO - Desinstalar servicio
cd /d "%~dp0"
net session >nul 2>&1
if %errorlevel% neq 0 (
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)
set "NSSM=%~dp0nssm.exe"
if not exist "%NSSM%" ( echo Falta nssm.exe en esta carpeta. & pause & exit /b )
echo Deteniendo y eliminando el servicio HOSTELERO...
"%NSSM%" stop HOSTELERO
"%NSSM%" remove HOSTELERO confirm
netsh advfirewall firewall delete rule name="HOSTELERO TPV" >nul 2>&1
echo.
echo  Servicio HOSTELERO eliminado.
pause
