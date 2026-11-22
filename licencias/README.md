# Licencias

Licencia del Portal RvR e inventario de licencias de terceros (web, API, app móvil, fuentes y servicios).

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | Página de licencias: licencia propia, gráfica por capa, inventario con buscador y filtros, glosario y cumplimiento. Modo claro/oscuro. |
| `mapa.html` | Mapa conceptual en hoja A3 horizontal. |
| `mapa-licencias.pdf` | El mapa ya exportado. |
| `LICENCIA.md` | Texto de la licencia privativa. |
| `datos.js` | Los datos de las dos páginas. Lo único que hay que editar. |
| `fuentes/` | Sora y Plus Jakarta Sans con su licencia OFL. |

## Cómo verlo
Abrir `index.html` con doble clic. El logo sale de `../public/marca/`.

## Cómo actualizarlo
1. Cambiar el titular o los autores en `datos.js` → `proyecto.titular`.
2. Si cambia una versión, editar el ítem en `datos.js` → `capas`.
3. Regenerar el PDF: abrir `mapa.html` → **Guardar en PDF** (A3 horizontal, sin márgenes).

## Pendiente
- Confirmar la licencia de **Glass Fold (GradFlow)** y **Liquid Glass Button**, o reemplazarlos.
