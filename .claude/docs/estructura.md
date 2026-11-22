# Estructura del proyecto

## Para qué sirve
Saber dónde va cada cosa.

## Mapa
```
frontend/                 app cliente (React)
  src/app/                rutas, layouts, providers
  src/features/<m>/       pages/ components/ api.ts  (api.ts = "services": llamadas HTTP)
  src/shared/             componentes, hooks y lib comunes
  public/                 estáticos
  demo/                   backend dentro del navegador (Vercel)
backend/                  servidor (Express)
  src/app.ts              arma la app y monta las rutas /api/*
  src/routes/<m>.routes.ts           URL + permiso → controller
  src/controllers/<m>.controller.ts  lee req (params, body, sesión) y responde
  src/models/<m>.model.ts            zod + SQL + reglas del negocio
  src/middlewares/        sesion.ts (sesión, permisos), errores.ts (asincrono, manejador)
  src/utils/              errores HTTP, validadores comunes, avisos, token JWT, lista de módulos
  db/                     SQL: esquema, catálogos, KPIs, datos demo
  pruebas/                pruebas de punta a punta
```

## Reglas del backend
- Un pedido va: route → controller → model → base.
- El model nunca toca `req` ni `res`: recibe datos ya leídos.
- El controller valida con el esquema zod que exporta el model (`x.datosAlgo.parse(req.body)`).
- Lo que depende de la sesión (cliente, técnico, permisos) lo saca el controller.

## Ejemplo: agregar un módulo "garantías"
1. `backend/src/models/garantias.model.ts`: esquema zod + funciones con SQL.
2. `backend/src/controllers/garantias.controller.ts`: `listar(req, res)` llama al model.
3. `backend/src/routes/garantias.routes.ts`: `rutasGarantias.get('/', permiso('garantias.listar'), asincrono(garantias.listar))`.
4. Montarla en `backend/src/app.ts` y en `frontend/demo/servidor.ts`.
5. Frontend: `frontend/src/features/garantias/` con `api.ts`, `pages/`, `index.ts`.
