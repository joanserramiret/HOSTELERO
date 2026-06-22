@echo off
title HOSTELERO - Instalar servicio
cd /d "%~dp0"

REM --- Auto-elevar a Administrador (los servicios lo requieren) ---
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Solicitando permisos de administrador...
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)

set "DIR=%~dp0"
set "NSSM=%DIR%nssm.exe"

echo ==========================================================
echo    HOSTELERO - Instalar como servicio de Windows
echo ==========================================================
echo.

REM --- Comprobar NSSM ---
if not exist "%NSSM%" (
  echo  [FALTA NSSM]  No encuentro "nssm.exe" en esta carpeta.
  echo.
  echo  1^) Descarga NSSM:  https://nssm.cc/download   ^(archivo .zip^)
  echo  2^) Abre el zip, entra en la carpeta "win64" y copia "nssm.exe"
  echo     a esta misma carpeta:
  echo        %DIR%
  echo  3^) Vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b
)

REM --- Comprobar Node.js ---
set "NODE="
for /f "delims=" %%i in ('where node 2^>nul') do set "NODE=%%i"
if "%NODE%"=="" (
  echo  [ERROR] No se encuentra Node.js. Instalalo desde https://nodejs.org y reintenta.
  pause
  exit /b
)
echo  Node.js:  %NODE%
echo.

REM --- (Re)instalar el servicio ---
echo  Instalando servicio "HOSTELERO"...
"%NSSM%" stop HOSTELERO >nul 2>&1
"%NSSM%" remove HOSTELERO confirm >nul 2>&1
"%NSSM%" install HOSTELERO "%NODE%" "server.cjs"
"%NSSM%" set HOSTELERO AppDirectory "%DIR%"
"%NSSM%" set HOSTELERO Start SERVICE_AUTO_START
"%NSSM%" set HOSTELERO AppStdout "%DIR%server.log"
"%NSSM%" set HOSTELERO AppStderr "%DIR%server.log"
"%NSSM%" set HOSTELERO AppStdoutCreationDisposition 2
"%NSSM%" set HOSTELERO AppStderrCreationDisposition 2
"%NSSM%" set HOSTELERO DisplayName "HOSTELERO TPV (servidor local)"
"%NSSM%" set HOSTELERO Description "Servidor local de HOSTELERO: sirve las apps por puertos (7870-7874) y sincroniza en tiempo real (LAN, sin internet)."
"%NSSM%" set HOSTELERO AppExit Default Restart
"%NSSM%" set HOSTELERO AppRestartDelay 3000

REM --- Abrir puertos en el firewall (red privada) ---
echo  Abriendo puertos 7870-7874 en el Firewall de Windows (red privada)...
netsh advfirewall firewall delete rule name="HOSTELERO TPV" >nul 2>&1
netsh advfirewall firewall add rule name="HOSTELERO TPV" dir=in action=allow protocol=TCP localport=7870-7874 profile=private >nul 2>&1

REM --- Arrancar ---
"%NSSM%" start HOSTELERO

echo.
echo  ==========================================================
echo   LISTO. Servicio "HOSTELERO" instalado y arrancado.
echo   - Arranca solo cada vez que enciendas el PC.
echo   - Corre en segundo plano (sin ventana) y se reinicia si falla.
echo.
echo   Comprobar:  abre http://localhost:7870  en este PC.
echo   Gestionar:  ejecuta  services.msc  y busca "HOSTELERO".
echo   Registro:   server.log  (en esta carpeta).
echo  ==========================================================
echo.
pause
