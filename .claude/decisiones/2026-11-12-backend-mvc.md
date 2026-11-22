# Backend en routes / controllers / models / middlewares

## Para qué
Seguir el esquema pedido: cada capa en su carpeta, fácil de encontrar y de explicar.

## Qué se hizo
- `modulos/<m>.ts` (ruta + lógica + SQL juntos) se partió en tres archivos por módulo:
  `routes/<m>.routes.ts`, `controllers/<m>.controller.ts`, `models/<m>.model.ts`.
- `auth/rutas.ts` → igual, como módulo `auth`.
- `auth/middleware.ts` → `middlewares/sesion.ts`.
- `errores.ts` se partió: tipos de error en `utils/errores.ts`, manejador y `asincrono` en `middlewares/errores.ts`.
- `comun.ts`, `avisos.ts`, `auth/sesion.ts` (→ `token.ts`), `auth/modulos.ts` → `utils/`.

## Regla de corte
- **Model**: esquemas zod, SQL, transacciones, reglas que lanzan `regla()`/`conflicto()`. No ve `req`.
- **Controller**: parsea `req` con el esquema del model (en el mismo orden que antes), saca datos de la sesión, responde.
- **Route**: URL, middlewares de sesión/permiso y el controller.

## Cómo se comprobó que no cambió nada
- `tsc` sin errores; build del frontend normal y demo; lint.
- `pruebas/flujo-completo.mjs` 147/147 y `pruebas/complementos.mjs` 131/131, antes y después,
  salida idéntica línea por línea. Base: PGlite + `@electric-sql/pglite-socket` (no hay PostgreSQL instalado).
- La demo compilada en el navegador: panel, clientes y órdenes sin errores.
