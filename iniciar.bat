@echo off
title Portal RvR Tecnologias - servidor de desarrollo
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Node.js no esta instalado en Windows.
  echo      Descargalo aqui: https://nodejs.org  (version LTS^)
  echo      Instalalo, cierra esta ventana y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do echo  Node %%v detectado.

if not exist "node_modules\vite" (
  echo.
  echo  Instalando dependencias, esto tarda 1-2 minutos...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  [X] Fallo la instalacion. Revisa el mensaje de arriba.
    pause
    exit /b 1
  )
)

rem ---------------------------------------------------------------- API
rem El portal trabaja siempre contra la API y PostgreSQL. api\.env lo crea
rem montar-base.bat con la conexion a la base.
if not exist "api\.env" (
  echo.
  echo  [X] No hay api\.env: la base de datos no esta configurada.
  echo      Ejecuta primero montar-base.bat ^(crea la base rvr y los archivos .env^)
  echo      y despues vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)
call :api

echo.
echo  Levantando el portal en http://localhost:5173
echo  Para detenerlo: Ctrl + C
echo.
call npm run dev
pause
exit /b

rem ---------------------------------------------------------------- :api
rem Abre la API en otra ventana y espera hasta 40 segundos a que responda
rem /api/salud con la base conectada, para no abrir el portal antes de tiempo.
:api
if not exist "api\node_modules\nodemailer" (
  echo.
  echo  Instalando dependencias de la API...
  pushd api
  call npm install
  popd
)
echo.
echo  Levantando la API en http://localhost:4000/api  ^(ventana aparte, no la cierres^)
start "API RvR - no cerrar" /D "%~dp0api" cmd /k npm run dev
echo  Esperando a que la API responda...
powershell -NoProfile -Command "for ($i = 0; $i -lt 40; $i++) { try { $r = Invoke-RestMethod 'http://localhost:4000/api/salud' -TimeoutSec 2; if ($r.ok) { exit 0 } } catch { }; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo.
  echo  [!] La API no respondio o no se pudo conectar a PostgreSQL.
  echo      Mira el mensaje en la ventana "API RvR - no cerrar".
  echo      Si dice contrasena o autenticacion, vuelve a ejecutar montar-base.bat
  echo      Si dice ECONNREFUSED, el servicio de PostgreSQL esta apagado.
  echo.
) else (
  echo  [OK] API conectada a la base de datos.
)
goto :eof
