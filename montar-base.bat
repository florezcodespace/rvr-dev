@echo off
title Portal RvR Tecnologias - Montar la base de datos
cd /d "%~dp0"

rem Crea (o reinicia) la base "rvr" en tu PostgreSQL, carga las tablas y los
rem catalogos, y deja configurados api\.env y .env para que el portal la use.
rem Todo el trabajo lo hace db\montar.ps1.

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Node.js no esta instalado. Descargalo en https://nodejs.org ^(version LTS^)
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0db\montar.ps1"
echo.
pause
