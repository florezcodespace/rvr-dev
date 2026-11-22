# Separar el proyecto en frontend/ y backend/

## Para qué
Seguir el esquema pedido: una carpeta por app, cada una con su `package.json`, `src/` y `.env`.

## Qué se movió
- Raíz → `frontend/`: `src/`, `public/`, `demo/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `package*.json`, `.env.example`.
- `api/` → `backend/`.
- `db/` → `backend/db/` (los SQL son del servidor).

## Rutas que se ajustaron
- `frontend/vite.config.ts`: la API está en `../backend/src`; `server.fs.allow` deja a Vite servir esa carpeta en `dev:demo`.
- `frontend/demo/*.ts`: imports a `../../backend/src` y `../../backend/db`.
- `vercel.json`: compila `frontend/package.json` (sale en `frontend/dist`).
- `iniciar.bat`, `montar-base.bat`, `backend/db/montar.ps1`: nuevas rutas de `.env` y carpetas.

## Qué NO se cambió (todavía)
- Adentro, el frontend sigue por features (`features/<modulo>/pages|components|api.ts`).
  Es lo mismo que `pages/components/services`, pero agrupado por módulo.
- El backend se partió después en `routes/controllers/models/middlewares`: ver `2026-11-12-backend-mvc.md`.

## Ojo al pasar a la copia principal
Los `.env` no viajan con git: mover `api/.env` → `backend/.env` y `.env` → `frontend/.env`,
o correr `montar-base.bat` otra vez. Borrar `api/`, `node_modules/` y `db/` viejos que queden sueltos.
