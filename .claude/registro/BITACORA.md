# Bitácora

## 2026-10-28
**Hecho**
- Registro de cuentas: la causa era la API corriendo con el `api/.env` viejo
  (arrancó 8:22, `montar-base.bat` reescribió `.env` 9:23). Solución: reiniciar la API.
- Demo local (`dev:demo`) no recibía variables de entorno: se completan en `demo/servidor.ts`.
- Comprobantes de pago: datos por método (Tarjeta, Nequi, Daviplata, PSE, Transferencia).
  PSE es método nuevo. Columna `comprobante_pago.detalle_pago jsonb`.
- Detalle de orden (admin): servicio completado u orden cerrada → ojo para ver notas (antes lápiz).

**Archivos**
- `db/01-esquema.sql`, `db/99-datos-demo.sql`, `db/modelo.dbml`, `db/migraciones/2026-10-28-detalle-pago.sql` (ya aplicada a la base local)
- `api/src/modulos/{comprobantes,portal,ventas}.ts`
- `src/features/portal/components/CamposMetodoPago.tsx` (nuevo), `src/features/portal/pages/MiOrdenPage.tsx`, `src/features/portal/api.ts`
- `src/features/ventas/{api.ts,pages/ComprobantesPage.tsx}`, `src/shared/domain/estados.ts`
- `src/features/ordenes/pages/OrdenDetallePage.tsx`, `demo/servidor.ts` (base demo `rvr-demo-v6-5`)

**Después (mismo día)**
- API reiniciada en ventana aparte ("API RvR - no cerrar"). /api/salud: base conectada.
- Probado contra PostgreSQL: registro OK; pago PSE valida campos y se guarda con su detalle.
- Datos de prueba que quedaron en la base: cuenta prueba.registro@ejemplo.test (doc 1098765432) y
  comprobante #3 de $1.000 (PSE, ref PRUEBA-CUS-123456) en la orden OS-2026-0029, pendiente.

**Falta**
- Rechazar el comprobante #3 de prueba desde Comprobantes (o dejarlo).
- Nada está en commit.

## 2026-10-29
**Hecho**
- Pago estilo pasarela en cliente (Reportar un pago) y admin (Registrar abono): paso 1 "Elige cómo pagar",
  paso 2 datos del método. Tarjeta con vista en vivo, Luhn, vencimiento, CVV, documento y cuotas.
- Detección automática de banco por BIN: tabla de 1.158 BINs de Colombia (bin-list-data, CC-BY-4.0).
- Los abonos también guardan `detalle_pago` y se ven en Abonos y en el detalle de la venta.
- Al aprobar un comprobante, el abono hereda sus datos.
- Probado en la demo (cliente: débito Nequi; admin: crédito Davivienda) y validación en la API real.

**Archivos**
- Nuevos: `src/shared/components/pago/*`, `src/shared/lib/tarjetas/*`, `api/src/pagos.ts`, `scripts/generar-bins.cjs`
- Cambiados: `api/src/modulos/{comprobantes,ventas,portal}.ts`, `src/features/ventas/{Modales.tsx,api.ts,pages/AbonosPage.tsx,pages/VentaDetallePage.tsx}`,
  `src/features/portal/pages/MiOrdenPage.tsx`, `src/shared/domain/estados.ts`, `db/01-esquema.sql`,
  `db/migraciones/2026-10-28-detalle-pago.sql` (aplicada), `demo/servidor.ts` (base `rvr-demo-v6-6`)
- Borrado: `src/features/portal/components/CamposMetodoPago.tsx` (reemplazado)

**Falta**
- Pasarela de pago real (Wompi/ePayco).
- Nada está en commit.

## 2026-11-11 — Carpeta `licencias/` (inventario y licencia propia)

**Qué se hizo**
- Licencia propia: software privativo, © 2026 Equipo de desarrollo Portal RvR, uso exclusivo de RvR Tecnologías S.A.S.
- Inventario real de licencias (package-lock web y API, pubspec.lock de la app móvil en `Sena/Trimestre 5/mobile`).
- Página `licencias/index.html` (estilo Cristal, claro/oscuro, buscador, filtros, gráfica por capa, glosario, cumplimiento).
- Mapa conceptual `licencias/mapa.html` y su `mapa-licencias.pdf` (A3 horizontal, exportado con Edge sin cabecera).

**Archivos** (en el worktree `licenses-folder-design-14d24e`, rama `claude/licenses-folder-design-14d24e`)
- Nuevos: `licencias/{index.html, mapa.html, mapa-licencias.pdf, datos.js, LICENCIA.md, README.md, fuentes/*}`

**Falta**
- Confirmar licencia de Glass Fold (GradFlow) y Liquid Glass Button.
- Nombres reales de los autores en `licencias/datos.js` → `proyecto.titular`.
- Sin commit. Copiada también a la carpeta principal (`RVR DEV/licencias/`) el mismo día.

## 2026-11-12
**Hecho:** proyecto separado en `frontend/` y `backend/` (con `git mv`, se conserva el historial).
`db/` pasó a `backend/db/`. Se crearon `.claude/` y `.claude/launch.json` (demo en :5180).

**Archivos tocados:** `frontend/vite.config.ts`, `frontend/demo/servidor.ts`, `frontend/demo/pglite.worker.ts`,
`frontend/demo/shims/pg.ts`, `vercel.json`, `iniciar.bat`, `montar-base.bat`, `backend/db/montar.ps1`,
`README.md`, `backend/README.md`, `backend/db/README.md`, `.gitignore`.

**Verificado:** build del frontend, build demo (también sin `backend/node_modules`, como en Vercel),
lint, `tsc` del backend, y la demo compilada en el navegador (login + panel sin errores).

**No verificado:** `iniciar.bat` / `montar-base.bat` con PostgreSQL real.

### Backend en routes / controllers / models / middlewares
**Hecho:** los 17 módulos (16 de `modulos/` + `auth`) partidos en tres archivos cada uno.
Middlewares a `middlewares/`, ayudas a `utils/`. Borradas `src/modulos/` y `src/auth/`.

**Archivos tocados:** todo `backend/src/` (nuevas carpetas routes, controllers, models, middlewares, utils),
`backend/src/app.ts`, `frontend/demo/servidor.ts`, `README.md`, `backend/README.md`, `.claude/docs/estructura.md`.

**Verificado:** `tsc` ok; pruebas 147/147 y 131/131 iguales antes y después (base PGlite);
build normal y demo del frontend; demo en navegador sin errores.

**Commit:** `d7c5015` (rehecho encima de `8c94f57`, ver abajo).

**Falta:**
- `pruebas/complementos.mjs` falla los jueves y viernes: busca una franja "dentro de 2 días" y cae en fin de semana.
  Para correrla hoy se adelantó el reloj de la prueba un día. No se cambió el archivo.
- `pruebas/flujo-completo.mjs` está desactualizada con los pagos nuevos: no envía celular/titular (Nequi)
  ni banco (Transferencia), así que el abono da 422. Pasaba igual antes de reorganizar.

### Unir los cambios locales con la estructura nueva
**Hecho:**
- La carpeta principal tenía 190 cambios + 65 archivos nuevos sin commit. Se guardaron tal cual en `main` (`8c94f57`).
- La reorganización se rehízo encima (rebase → `d7c5015`). Tus cambios del backend se pasaron a mano a
  `models/` y `controllers/`: auth (tipo de documento), clientes (acceso al portal, validación en vivo),
  usuarios (rol Cliente con ficha), roles (eliminar), servicios (duración y garantía), agenda (duración),
  ventas (`registrarAbono` compartido), portal (comprobantes y reclamo de garantía), órdenes (detalle con garantía).
- Módulos nuevos partidos en tres: `comprobantes` y `garantias`. `cuentas.ts` y `pagos.ts` → `backend/src/utils/`.
- Carpetas nuevas movidas: `frontend/src/...`, `frontend/public/fonts`, `backend/db/migraciones`, `frontend/scripts/generar-bins.cjs`.
- Rutas actualizadas en `.claude/docs/` y `licencias/datos.js`.

**Verificado:** `tsc` ok; build normal y demo; lint. Pruebas comparadas contra tu versión `8c94f57`, salida idéntica:
`complementos` 131/131; `flujo-completo` 28 ✓ y se corta igual; una copia con datos de pago llega al final, 143/147 en las dos.
Demo en navegador: garantías, comprobantes y detalle de orden con garantía, sin errores.

**En la carpeta principal:** `main` avanzado hasta la estructura nueva. `.env` → `frontend/.env`, `api/.env` → `backend/.env`, `node_modules` → `frontend/` y `api/node_modules` → `backend/`. Restos viejos excluidos de git (`api/`, `db/kpis`, `src/` sueltos) guardados en `_respaldos/2026-11-12-restos-estructura-vieja/`. Compila desde ahí (backend, frontend y demo).

**Falta:**
- Subir a GitHub (push) cuando lo decidas. Hay 4 commits sin subir; `subir-a-github.bat` hace `git push -u origin main`.
- Actualizar `pruebas/flujo-completo.mjs` a los pagos nuevos.

## 2026-11-13
**Hecho:** página en local con la estructura nueva. Backend (:4000) conectado a PostgreSQL 18 local (base `rvr`)
y frontend (:5173). Probado: login de administrador, panel, garantías y comprobantes, sin errores.
`.claude/launch.json` con `backend`, `frontend` y `frontend-demo` para la vista previa de Claude.

**Archivos:** `.claude/launch.json`.

**Falta:** subir a GitHub; actualizar `backend/pruebas/flujo-completo.mjs` a los pagos nuevos.

### Menú lateral con secciones plegables
**Hecho:** cada sección del menú (Dashboard, Venta – Órdenes, Servicios, Configuración) se pliega con clic en su título.
Varias abiertas a la vez; plegada muestra cuántos módulos esconde. Lo plegado se recuerda en el navegador
(`rvr.sidebar-secciones-plegadas`); la primera vez, todas abiertas. La sección de la página actual se abre sola.
En el modo de solo íconos no cambia nada. Lo escondido queda `inert` (fuera del tabulador y del lector de pantalla).

**Archivos:** `frontend/src/app/layouts/components/Sidebar.tsx`, `frontend/src/app/layouts/useSidebar.ts` (`useSeccionesMenu`),
`frontend/src/shared/lib/storage.ts`, `.claude/launch.json` (ya con `backend`, `frontend` y `frontend-demo`).

**Verificado:** `tsc` y lint ok. En el navegador (1440 px): plegar y desplegar, el estado sobrevive a recargar,
al entrar a Clientes se abre su sección, la píldora del módulo activo se esconde y vuelve a su sitio. Sin errores en consola.

**Falta:** subir a GitHub.

## 2026-11-20

### Costeo del proyecto en Excel
**Hecho:** `docs/costeo/Costeo-RvR.xlsx`, mismo formato que el ejemplo de VidaKids. Una fila por HU (81 web + 11 móvil)
más una fila "API" por submódulo; 369 h estimadas. Precio hora, gastos, riesgo, ganancia y presupuesto con los
valores del ejemplo. Se agregó "Total + consumo" (H18) y "Diferencia vs presupuesto" (H19). Se corrigió M11
(el ejemplo dejaba fuera la fila 2). Generador: script de una sola vez, no quedó en el repo.

**Archivos:** `docs/costeo/Costeo-RvR.xlsx` (en la rama `claude/costeo-spreadsheet-setup-7b29e8`), `.claude/docs/costeo.md`.

**Verificado:** recalculado en Excel, 0 errores; totales revisados a mano.

**Falta:** poner salario, gastos y presupuesto reales; ajustar horas; commit.
