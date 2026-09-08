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

echo.
echo  Levantando el servidor en http://localhost:5173
echo  Para detenerlo: Ctrl + C
echo.
call npm run dev
pause
