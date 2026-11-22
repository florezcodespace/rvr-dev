# Licencias del proyecto

Para qué: mostrar la licencia propia (privativa) y la de cada herramienta de terceros.

## Dónde
`licencias/` en la raíz. Todo sale de `licencias/datos.js`.

## Pasos para actualizar
1. Versiones: `frontend/package-lock.json`, `backend/package-lock.json`, `pubspec.lock` de la app móvil.
2. Editar `datos.js` (capas, indirectas, servicios).
3. Abrir `mapa.html` → Guardar en PDF (A3 horizontal, sin márgenes) → `mapa-licencias.pdf`.

## Ejemplo
Nueva dependencia web: agregar en `capas[web].items`
`{ nombre: 'Día.js', version: '1.11.13', uso: 'Fechas', licencia: 'MIT', url: 'https://day.js.org' }`.
