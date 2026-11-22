# Portal RvR Tecnologías — resumen vivo

## Qué es
Portal web de RvR (servicios técnicos: CCTV, redes, servidores). Admin/coordinador
gestionan clientes, órdenes, cotizaciones y pagos; el cliente tiene su portal.
La API también la usa la app móvil del técnico. Base: PostgreSQL.

## Carpetas
- `frontend/` → React 19 + Vite 8 + Tailwind v4. Código en `frontend/src/` (features en `frontend/src/features/*`).
  `frontend/demo/` hace correr el backend dentro del navegador sobre PGlite (lo que se publica en Vercel).
- `backend/` → Express 5 + TypeScript. `backend/src/` con `routes/`, `controllers/`, `models/`, `middlewares/`, `utils/`.
  SQL en `backend/db/` (`01-esquema`, `02-catalogos`, `99-datos-demo`, `migraciones/` para bases ya montadas).
  Pruebas en `backend/pruebas/`.
- `licencias/` licencia propia + inventario de licencias de terceros (ver `.claude/docs/licencias.md`).
- Raíz: `iniciar.bat`, `montar-base.bat`, `vercel.json`, `docs/`, `DESIGN.md`, `PRODUCT.md`.

## Cómo se corre (Windows)
1. `montar-base.bat` → crea la base `rvr`, escribe `backend/.env` y `frontend/.env`.
2. `iniciar.bat` → levanta backend (:4000) y frontend (:5173).

Manual: `cd backend && npm run dev` y `cd frontend && npm run dev`.
Demo: `cd frontend && npm run dev:demo` o `npm run build:demo`. Cuentas demo en `frontend/src/app/demo/CuentasDemo.tsx`.

## Estado actual
- 2026-11-12: separado en `frontend/` y `backend/` (ver `decisiones/2026-11-12-frontend-backend.md`).
- 2026-11-12: backend partido en routes/controllers/models/middlewares (ver `decisiones/2026-11-12-backend-mvc.md`).
- 2026-11-12: los cambios que estaban sin commit (pagos, garantías, comprobantes, landing, licencias) quedaron en git
  y pasados a la estructura nueva.

## Más info
- Guía de estructura: `docs/estructura.md`
- README del proyecto: `README.md`, `backend/README.md`, `backend/db/README.md`
