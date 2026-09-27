# ============================================================================
#  Portal RvR Tecnologías · Montar (o reiniciar) la base de datos en Windows
#
#  Lo llama `montar-base.bat`, en la raíz del proyecto. Hace todo en orden:
#    1. Busca psql (el de PostgreSQL instalado en Windows).
#    2. Pide la contraseña del usuario postgres, sin mostrarla.
#    3. Borra la base `rvr` si existe y la crea de nuevo, vacía.
#    4. Carga 01-esquema.sql y 02-catalogos.sql, y si se pide, 99-datos-demo.sql
#       (modelo v6: 20 tablas, 82 permisos, un permiso por caso de uso).
#    5. Escribe api/.env (conexión y clave de sesiones) y .env del portal.
#    6. Instala las dependencias de la API si faltan.
#
#  ⚠ Reiniciar borra TODOS los datos de la base `rvr`.
# ============================================================================

# 'Continue' y no 'Stop': en Windows PowerShell 5.1, con 'Stop' cualquier línea
# que psql escriba en stderr (un simple aviso) corta el script.
$ErrorActionPreference = 'Continue'
$raiz   = Split-Path -Parent $PSScriptRoot
$dbDir  = $PSScriptRoot
$base   = 'rvr'
# Si tu PostgreSQL usa otro puerto: set RVR_PG_PUERTO=5433 antes de ejecutar.
$puerto = if ($env:RVR_PG_PUERTO) { [int]$env:RVR_PG_PUERTO } else { 5432 }
$apiDir = Join-Path $raiz 'api'
$sinBom = New-Object System.Text.UTF8Encoding $false

function Titulo($texto) { Write-Host ''; Write-Host "  $texto" -ForegroundColor Cyan }
function Ok($texto)     { Write-Host "  [OK] $texto" -ForegroundColor Green }
function Falla($texto)  {
  Write-Host ''
  Write-Host "  [X] $texto" -ForegroundColor Red
  Write-Host ''
  exit 1
}

# ---------------------------------------------------------------- 1. psql
Titulo 'Buscando PostgreSQL...'
$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) {
  $psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
    Sort-Object { [int]($_.FullName -replace '.*PostgreSQL\\(\d+).*', '$1') } -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}
if (-not $psql) {
  Falla 'No encontramos PostgreSQL. Instalalo desde https://www.postgresql.org/download/windows/'
}
Ok "psql: $psql"

# ------------------------------------------------------------ 2. contraseña
Titulo 'Contraseña del usuario postgres (la que pusiste al instalar PostgreSQL).'
$segura = Read-Host '  Contraseña' -AsSecureString
$clave  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura))

$env:PGPASSWORD       = $clave
$env:PGCLIENTENCODING = 'UTF8'
# Sin los avisos NOTICE ("la tabla no existe, se omite") que asustan y no importan.
$env:PGOPTIONS        = '-c client_min_messages=warning'
$conexion = @('-h', 'localhost', '-p', $puerto, '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q')

& $psql @conexion -d postgres -c 'SELECT 1' *> $null
if ($LASTEXITCODE -ne 0) {
  Falla "No pudimos entrar a PostgreSQL en localhost:$puerto. Revisa la contraseña y que el servicio de PostgreSQL esté iniciado."
}
Ok 'Conectado a PostgreSQL.'

# ---------------------------------------------------------- 3. base nueva
Titulo "Se va a BORRAR la base '$base' con todos sus datos y se va a crear de nuevo."
$sigue = Read-Host '  Escribe SI para continuar'
if ($sigue.Trim().ToUpper() -ne 'SI') { Falla 'Cancelado. No se tocó nada.' }

& $psql @conexion -d postgres -c "DROP DATABASE IF EXISTS $base WITH (FORCE)"
if ($LASTEXITCODE -ne 0) { Falla "No se pudo borrar la base $base." }
& $psql @conexion -d postgres -c "CREATE DATABASE $base ENCODING 'UTF8' TEMPLATE template0"
if ($LASTEXITCODE -ne 0) { Falla "No se pudo crear la base $base." }
Ok "Base '$base' creada, vacía."

# ------------------------------------------------------------- 4. scripts
$demo = Read-Host '  ¿Cargar también los datos de demostración (clientes, ~65 cotizaciones y ~45 órdenes de prueba)? S/N'
$archivos = @('01-esquema.sql', '02-catalogos.sql')
if ($demo.Trim().ToUpper().StartsWith('S')) { $archivos += '99-datos-demo.sql' }

foreach ($archivo in $archivos) {
  & $psql @conexion -d $base -f (Join-Path $dbDir $archivo) | Out-Null
  if ($LASTEXITCODE -ne 0) { Falla "Falló $archivo. Revisa el mensaje de arriba." }
  Ok "Cargado $archivo"
}

$tablas = & $psql @conexion -d $base -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'"
$ordenes  = & $psql @conexion -d $base -At -c 'SELECT count(*) FROM orden'
$permisos = & $psql @conexion -d $base -At -c 'SELECT count(*) FROM permiso'
Ok "La base tiene $tablas tablas, $permisos permisos y $ordenes órdenes."

# ----------------------------------------------------------- 5. archivos .env
# Se escriben en UTF-8 SIN BOM: con BOM, la primera variable no se lee.
$claveUrl = [Uri]::EscapeDataString($clave)
$jwt = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })

$envApi = @"
# Generado por montar-base.bat. NO se sube a git: tiene la contraseña.
DATABASE_URL=postgresql://postgres:$claveUrl@localhost:$puerto/$base
JWT_SECRET=$jwt
SESION_HORAS=8
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
# Enlace del correo de recuperación de contraseña (HU_72).
PORTAL_URL=http://localhost:5173
# Correo saliente (opcional). Sin SMTP_HOST, en desarrollo el enlace de
# recuperación aparece en la pantalla y en la consola de la API.
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=cuenta@gmail.com
# SMTP_PASS=clave-de-aplicacion
"@
[IO.File]::WriteAllText((Join-Path $apiDir '.env'), $envApi, $sinBom)
Ok 'api\.env escrito (conexión a la base).'

$envPortal = @"
# Dirección de la API. El portal trabaja siempre contra la base de datos real.
VITE_API_URL=http://localhost:4000/api
"@
[IO.File]::WriteAllText((Join-Path $raiz '.env'), $envPortal, $sinBom)
Ok '.env del portal escrito (usa la API).'

# ---------------------------------------------------- 6. dependencias de la API
# nodemailer es la última dependencia agregada: si falta, la instalación está vieja.
if (-not (Test-Path (Join-Path (Join-Path $apiDir 'node_modules') 'nodemailer'))) {
  Titulo 'Instalando las dependencias de la API (1 o 2 minutos)...'
  Push-Location $apiDir
  & npm install
  $codigo = $LASTEXITCODE
  Pop-Location
  if ($codigo -ne 0) { Falla 'Falló npm install en la carpeta api.' }
  Ok 'Dependencias de la API instaladas.'
}

$env:PGPASSWORD = $null
$env:PGOPTIONS  = $null
Titulo 'Listo. Ahora ejecuta iniciar.bat para abrir el portal con la base de datos.'
Write-Host ''
