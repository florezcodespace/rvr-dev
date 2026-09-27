# Portal RvR Tecnologías — Web + API

Sistema de gestión de RvR Tecnologías construido sobre los **diagramas de casos
de uso v6**, la **matriz de historias de usuario v6** (81 HU web + 11 HU móvil),
la **ficha técnica aprobada** y la **base de datos final** (PostgreSQL).

```
RVR DEV/
├── src/        portal web (React 19 + TypeScript + Vite 8 + Tailwind v4)
├── api/        API REST (Node + Express 5 + TypeScript) — la usan la web y la app móvil
├── db/         esquema, catálogos, datos de demostración y consultas de PostgreSQL
└── docs/       trazabilidad HU → pantalla → API → permiso
```

## Tres portales y una app

| Portal | Rutas | Quién entra |
|---|---|---|
| **Público** | `/` (landing), `/catalogo`, `/login`, `/registro`, `/recuperar`, `/restablecer` | Cualquiera |
| **Administrativo** | `/panel`, `/roles`, `/permisos`, `/usuarios`, `/accesos`, `/servicios`, `/tecnicos`, `/horarios`, `/clientes`, `/cotizaciones`, `/ordenes`, `/agenda`, `/ventas`, `/abonos`, `/reportes`, `/indicadores`, `/perfil` | Administrador, Coordinador o cualquier rol creado con permisos del portal |
| **Cliente** | `/portal`, `/portal/catalogo`, `/portal/solicitar`, `/portal/cotizaciones`, `/portal/ordenes`, `/portal/perfil` | Rol Cliente (se registra solo en `/registro`) |
| **App móvil del técnico** | `/api/movil/…` (no hay pantallas web) | Rol Técnico, con cuenta vinculada a un técnico activo |

El técnico **no** entra a la web (el login le responde que use la app). Sus
módulos —acceso, órdenes asignadas, inicio y fin de visita, diagnóstico,
materiales, solución, estado de la orden, historial y recotización— están en la
API bajo `/api/movil` para que la app móvil se conecte. Lo que el técnico hace
desde el móvil aparece en el portal administrativo (detalle de la orden, agenda,
notificaciones) y en el portal del cliente.

La tabla completa de cada historia de usuario con su pantalla, endpoint y
permiso está en **[`docs/trazabilidad-v6.md`](docs/trazabilidad-v6.md)**.

## Módulos del portal administrativo

- **Configuración** — Roles (listar, buscar, registrar, editar, detalle, activar/inactivar) con los permisos en interruptores agrupados por módulo, al estilo de Discord; Permisos (CRUD, estado, detalle con los roles que lo tienen).
- **Usuarios** — Usuarios (CRUD, estado, detalle, restablecer contraseña con clave temporal); Registro de accesos (intentos, bloqueos, cierres de sesión, web y móvil).
- **Servicios** — Catálogo de servicios (CRUD, estado, detalle); Técnicos (CRUD, estado, detalle, cuenta para la app móvil); Horarios técnicos (registrar franjas —también repetidas por días—, consultar la semana, bloquear o liberar).
- **Venta – Órdenes** — Clientes (CRUD, estado, detalle con historial); Cotizaciones **maestro-detalle** (servicios del catálogo con precio congelado + repuestos, subtotal y total; enviar al cliente; registrar aprobación o rechazo; generar la orden); Órdenes de servicio (registrar desde cotizaciones aprobadas, observaciones, estado de la orden y de cada ítem, detalle con reporte técnico, visitas, venta e historial); Agendamiento (calendario mes/semana/lista, agendar sobre franjas libres, reprogramar o reasignar, cumplida/cancelada); Ventas (registrar con anticipo del 50 %, estado de pago, anular); Abonos (listar, registrar).
- **Dashboard** — Estadísticas generales, Indicadores de gestión y Reportes operacionales con exportación a **PDF y Excel**.
- **Mi perfil** — datos propios, contraseña y tema claro/oscuro.

Cada ítem del menú, cada pantalla y cada botón aparece solo si el rol tiene el
permiso, y la API lo vuelve a exigir en cada petición (RNF-021): quitar un
permiso en Roles se aplica desde la siguiente petición del usuario, sin cerrar
su sesión.

## Versión de demostración (Vercel, solo front)

Para revisar el portal sin instalar PostgreSQL ni encender la API, la web se
publica en **modo demostración**: la misma API de `api/src` corre **dentro del
navegador** y la base es PostgreSQL de verdad compilado a WebAssembly
([PGlite](https://pglite.dev)), cargado con `db/01-esquema.sql`,
`db/02-catalogos.sql` y `db/99-datos-demo.sql`. Todos los módulos, permisos,
triggers y reglas funcionan igual que con el servidor.

- La base se crea la primera vez (unos segundos) y queda guardada en ese
  navegador (IndexedDB): los cambios sobreviven a una recarga y las pestañas
  abiertas comparten los mismos datos.
- La pastilla **Demo** de la barra superior reinicia los datos de fábrica.
- El inicio de sesión muestra las cuentas de prueba en un clic.
- La recuperación de contraseña muestra el enlace en pantalla (no hay correo).

```bash
npm run dev:demo      # modo demostración en local
npm run build:demo    # compila lo mismo que Vercel (vercel-build)
```

Vercel usa `vercel.json`: compila con `npm run vercel-build` y sirve `dist/` como
SPA. Las piezas que reemplazan a Node en el navegador están en `demo/`
(`servidor.ts`, `pglite.worker.ts` y `shims/`); la compilación normal
(`npm run build`) no las incluye.

## Arranque en Windows

1. **`montar-base.bat`** — la primera vez, o cuando quieras reiniciar los datos.
   Pide la contraseña de `postgres`, crea la base `rvr`, pregunta si cargar los
   datos de demostración, escribe `api/.env` y `.env`, e instala la API.
2. **`iniciar.bat`** — cada vez que trabajes. Abre la API en otra ventana
   (`http://localhost:4000/api`), espera a que conecte con la base y levanta el
   portal en `http://localhost:5173`.

Manual:

```bash
npm install && (cd api && npm install)
# crea la base y carga db/01, db/02 y, si quieres, db/99 (ver db/README.md)
cp api/.env.example api/.env        # y completa DATABASE_URL y JWT_SECRET
(cd api && npm run dev)             # API en :4000
npm run dev                         # portal en :5173
```

## Cuentas de prueba

| Portal | Usuario | Contraseña |
|---|---|---|
| Administrativo · Administrador | `rvargas` (ricardo.vargas@rvrtec.co) | `RvR2026*admin` |
| Administrativo · Coordinador | `lgomez` (laura.gomez@rvrtec.co) | `RvR2026*coord` |
| Cliente (con datos demo) | `asuarez` (ana.suarez@gmail.com) · `crestrepo` | `RvR2026*cliente` |
| App móvil · Técnico | `jmora` (julian.mora@rvrtec.co) · `sherrera` (demo) | `RvR2026*tecnico` |

Tres intentos fallidos seguidos bloquean la cuenta 5 minutos (CA_13_05).

## Estructura del portal (feature-based)

```
src/
├── app/            providers, rutas (paths.ts, router.tsx, paginas.tsx) y layouts
│                   (DashboardLayout del personal, PortalLayout del cliente)
├── features/       una carpeta por módulo, cada una con api/ components/ pages/ index.ts
│   ├── auth  landing  portal  perfil  notificaciones  busqueda
│   ├── roles  permisos  usuarios  servicios  tecnicos  horarios
│   └── clientes  cotizaciones  ordenes  agenda  ventas  tablero
├── shared/         componentes sin negocio (ui, data, form, charts, detalle, icons…),
│                   domain/estados.ts (estados y transiciones del modelo), hooks y lib
└── styles/         tokens.css (paleta light/dark --rvr-*), componentes, animaciones
```

Reglas: una feature no importa de otra (lo común sube a `shared/`), todo sale por
el `index.ts` de la feature y `app/` solo compone. Excepción declarada: el
detalle de la orden usa los modales de Ventas (`ModalVenta`, `ModalAbono`).
Alias: `@/`, `@app/`, `@features/`, `@shared/`.

Cada módulo se descarga la primera vez que se abre (`React.lazy`): el cliente no
baja el código del portal administrativo.

## Detalles de uso

- **Filtros en la URL**: búsquedas, estados, fechas y página viven en los search params, así el enlace se comparte y «atrás» funciona.
- **Estado en un clic**: el badge de estado abre las transiciones válidas; los cambios con consecuencias (inactivar un técnico con visitas, editar un permiso usado por roles activos) piden confirmación.
- **Buscador global** (⌘K / Ctrl+K): órdenes, cotizaciones, clientes, técnicos, servicios, usuarios y módulos, según los permisos del rol.
- **Notificaciones**: la campana consulta cada 30 s; ahí llegan las solicitudes de clientes, las respuestas a cotizaciones y lo que hace el técnico desde el móvil.
- **Exportar**: Reportes genera PDF y Excel (.xlsx) en el navegador, sin librerías externas.
- **Móvil**: el portal administrativo tiene barra inferior con los módulos de operación y «Menú» con todos los del rol; el portal del cliente, barra inferior propia.

## Verificación

```bash
npx tsc -b && npm run lint && npm run build     # portal
(cd api && npx tsc --noEmit)                     # API
(cd api && node pruebas/flujo-completo.mjs)      # 147 comprobaciones, base recién montada con demo
(cd api && node pruebas/complementos.mjs)        # 131 comprobaciones, base recién montada con demo
```
