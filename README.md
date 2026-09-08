# Portal RvR Tecnologías — Web

Frontend del portal de RvR Tecnologías. React 19 + TypeScript + Vite, con Tailwind v4
y un sistema de tokens light/dark extraído de los mockups.

## Arranque

**Windows (rápido):** doble clic en `iniciar.bat`. Instala dependencias si faltan y
levanta el servidor en http://localhost:5173.

**Manual** (PowerShell o CMD, parado en esta carpeta):

```bash
npm install      # requiere Node.js LTS  →  https://nodejs.org
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
npm run lint
```

> `node_modules` es específico del sistema operativo: no se copia entre Windows,
> Linux o Mac. Si cambias de equipo, borra la carpeta y vuelve a correr `npm install`.

## Credenciales de prueba (modo mock)

| Correo | Contraseña | Rol |
|---|---|---|
| ricardo.vargas@rvrtec.co | `RvR2026*admin` | Administrador |
| julian.mora@rvrtec.co | `RvR2026*tecnico` | Técnico |
| ana.suarez@clienteacme.co | `RvR2026*cliente` | Cliente (inactivo → error de cuenta inactiva) |

Tres intentos fallidos con el mismo correo activan el bloqueo temporal.

## Estructura (feature-based)

```
src/
├── app/                        # Composición de la aplicación
│   ├── App.tsx
│   ├── layouts/                # DashboardLayout (sidebar + topbar) y navegación
│   ├── providers/              # ThemeProvider, AppProviders
│   └── routes/                 # router, paths, guards, 404
├── features/                   # Una carpeta por proceso del negocio
│   ├── dashboard/              # Vista 2: KPIs, tendencia, estados, actividad
│   ├── ordenes/                # Listado y formulario de creación
│   ├── cotizaciones/ clientes/ pagos/     # Listados con estado editable
│   ├── tecnicos/ servicios/ usuarios/     # Tarjetas y tabla de cuentas
│   ├── reportes/ configuracion/           # Analítica y ajustes
│   ├── auth/
│   │   ├── api/                # authService (interfaz) + mockAuthService
│   │   ├── components/         # BrandPanel, LoginForm, DemoCredentials
│   │   ├── context/            # AuthContext + AuthProvider
│   │   ├── hooks/              # useAuth, useLogin
│   │   ├── pages/              # LoginPage
│   │   ├── schemas/            # loginSchema (zod)
│   │   ├── types/              # Usuario, Rol, Sesion, AuthError
│   │   └── index.ts            # API pública de la feature
│   └── dashboard/              # (placeholder de la Vista 2)
├── shared/                     # Transversal
│   ├── components/ui/          # Button, Input, Card, Tabs, StatCard, Toggle, Avatar…
│   ├── components/data/        # DataTable, Pager, EstadoBadge, SelectorEstado
│   ├── components/charts/      # SerieTemporal, Donut, BarrasRanking
│   ├── components/icons/       # Set de iconos del portal
│   ├── components/theme/       # ThemeToggle
│   ├── domain/                 # Enums del modelo de datos usados por varias features
│   ├── hooks/                  # useTheme
│   ├── lib/                    # cn, storage, delay, format
│   └── types/
└── styles/
    ├── tokens.css              # Paleta light/dark (--rvr-*)
    └── index.css               # Tailwind + mapeo de tokens
```

### Reglas de la estructura

1. **Una feature no importa desde otra feature.** Si dos la necesitan, sube a `shared/`.
2. **Todo lo que salga de una feature pasa por su `index.ts`.** Nadie importa
   `features/auth/components/LoginForm` directamente.
3. **`shared/components` no conoce el negocio.** `Button` no sabe qué es una orden de
   servicio. La excepción declarada es `shared/domain/`: enums del modelo de datos
   (p. ej. `estado_orden`) que consumen varias features.
4. **`app/` solo compone**: providers, rutas y layouts. Sin lógica de dominio.

Para agregar una feature (p. ej. órdenes): copiar el esqueleto de `auth`
(`api/ components/ hooks/ pages/ types/ index.ts`), registrar la ruta en
`app/routes/paths.ts` y `app/routes/router.tsx`.

## Alias de importación

`@/` → `src/` · `@app/` · `@features/` · `@shared/` (definidos en `vite.config.ts` y `tsconfig.app.json`).

## Temas light / dark

- Los colores viven **solo** en `src/styles/tokens.css` como variables `--rvr-*`,
  con un bloque `:root` (light) y otro `.dark`.
- `index.css` los mapea al namespace de Tailwind, así que en los componentes se usan
  clases semánticas: `bg-surface`, `text-fg-muted`, `border-border-strong`, `text-link`.
- **No** se escriben hex en los componentes (excepto el morado de marca del panel de login).
- El modo se guarda en `localStorage` (`rvr.theme`: `light | dark | system`) y un script
  en `index.html` aplica la clase antes del primer paint para evitar el parpadeo.

## Autenticación

`features/auth/api/authService.ts` define la interfaz; `mockAuthService.ts` la implementa
en memoria. Al conectar el backend se crea `httpAuthService.ts` con la misma interfaz y se
cambia **una línea** en `features/auth/api/index.ts`. Ni las vistas ni el contexto cambian.

## Gráficos

Las dos visualizaciones del dashboard son SVG propio, sin librería de charts:

- **Tendencia de órdenes** (14 días, creadas vs. completadas): línea + área, con
  crosshair y tooltip al pasar el mouse, navegable con las flechas del teclado y con
  una tabla equivalente para lectores de pantalla.
- **Órdenes por estado**: barras con valor sobre cada una, etiqueta debajo y tooltip
  con el porcentaje.

Las paletas están validadas para daltonismo y contraste en ambos temas, y viven en
`tokens.css` (`--rvr-chart-*`, `--rvr-estado-*`). La serie "Completadas" además va
punteada, así que las series nunca se distinguen solo por color.

## Filtros en la URL

El listado de órdenes guarda sus filtros en los search params
(`/ordenes?estado=nueva,pendiente&cliente=3&pagina=2`), no en estado local. Así el
link se puede compartir, el botón "atrás" del navegador funciona y recargar no
pierde el filtro. `useFiltrosOrdenes` es el único que lee y escribe esos params;
cualquier cambio de filtro vuelve a la página 1.

## Formulario de nueva orden

Tres secciones numeradas como en el mockup, validado con zod. Dos reglas de negocio
viven en el esquema, no en la vista:

- la fecha programada debe ser posterior a la de solicitud;
- para crear la orden ya **programada** hay que asignar técnico (es el agendamiento
  del modelo de datos).

El formulario guarda un **borrador local** (`localStorage`, clave `rvr.borrador-orden`)
800 ms después de cada cambio, solo si el usuario alcanzó a escribir algo. Si cierra la
pestaña por error, al volver encuentra la orden a medio llenar; el borrador se descarta
al crear la orden o al cancelar.

## Cambio de estado en un clic

El badge de estado **es** el control: al tocarlo se abre un menú con las
transiciones válidas desde el estado actual (`TRANSICIONES_*` en
`shared/domain/`). El cambio se pinta de inmediato, se guarda en segundo plano y
el aviso ofrece "Deshacer"; si el guardado falla, se revierte solo.

Los estados finales (Completada, Cancelada) se pintan sin flecha ni menú.

El flujo completo se puede consultar en **Configuración → Estados de órdenes**,
que lee el mismo mapa que alimenta los menús: cambiar una regla ahí cambia toda
la aplicación.

Lo mismo aplica al rol de un usuario y a la asignación de técnico desde la fila
del listado de órdenes.

## Atajos de teclado

| Atajo | Qué hace |
|---|---|
| `/` | Enfoca la búsqueda de la vista actual |
| `⌘K` / `Ctrl+K` | Enfoca el buscador global de la barra superior |
| `↑` `↓` + `Enter` | Recorre y elige dentro de los menús de estado |
| `Esc` | Cierra el menú abierto |
| `⌘S` / `Ctrl+S` | Guarda en Configuración |
| `←` `→` | Recorre los puntos de los gráficos de líneas |

## Verificación

Cada entrega se revisa con: `npm run build` (tsc + vite), `npm run lint`
(0 avisos), recorrido automatizado de las 12 vistas en claro y oscuro, prueba de
desborde horizontal a 1280/1024/768 px y auditoría de accesibilidad con axe-core
(sin violaciones WCAG A/AA).
