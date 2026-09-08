# QA — Portal RvR Tecnologías

**Fecha:** 8 de septiembre de 2026
**Objetivo:** `http://localhost:5173` (Vite dev, datos mock)
**Alcance:** las 12 vistas, claro y oscuro, a 1440 / 1280 / 1024 / 768 px
**Nivel:** Standard (se arregla crítico + alto + medio)
**Base del repo:** `ec58106` · **HEAD:** `2f95ef1`

**Resumen para PR:** *QA encontró 9 problemas, arregló 7, salud 72 → 97.*

---

## Salud

| Categoría | Peso | Antes | Después |
|---|---:|---:|---:|
| Consola | 15 % | 100 | 100 |
| Enlaces | 10 % | 0 | 100 |
| Visual | 10 % | 85 | 100 |
| Funcional | 20 % | 46 | 92 |
| UX | 15 % | 77 | 97 |
| Rendimiento | 10 % | 100 | 100 |
| Contenido | 5 % | 77 | 84 |
| Accesibilidad | 15 % | 95 | 100 |
| **Total** | | **72** | **97** |

---

## Lo que estaba bien

Conviene decirlo antes de la lista de fallos, porque condiciona el diagnóstico:
**cero errores de consola en las 12 vistas**, antes y después. `tsc -b` y `oxlint`
limpios. Los flujos que sí están construidos funcionan bien y con cuidado:

- Login con validación por campo, contador de intentos, bloqueo a los 3 fallos
  que resiste incluso la contraseña correcta, y error propio para cuenta inactiva.
- Filtros del listado de órdenes en la URL, con vuelta a la página 1 al cambiarlos.
- Cambio de estado desde el badge, con transiciones válidas leídas del mismo mapa
  que publica Configuración, pintado optimista, toast y **Deshacer** que revierte
  de verdad.
- Formulario de nueva orden con sus dos reglas de negocio en el esquema zod,
  borrador local que sobrevive al cierre de pestaña, y consecutivo correcto.
- Etiquetas ARIA por fila del tipo *"Estado En proceso de OS-0147. Cambiar estado"*.

---

## Problemas encontrados

### ISSUE-001 · Alto · La búsqueda ignoraba las tildes — **ARREGLADO** (`1285d21`)

Buscar `Clinica` en órdenes devolvía **0 resultados** aunque el listado tuviera
nueve filas de *Clínica San Rafael*. Con `Clínica` devolvía las 9.

En un portal en español esto rompe el buscador en la práctica: nadie escribe la
tilde al buscar. Afectaba a las **7 vistas con buscador** (órdenes, clientes,
cotizaciones, pagos, servicios, técnicos, usuarios), todas comparando con
`.toLowerCase().includes()` sin normalizar diacríticos.

Se extrajo `normalizar()` a `shared/lib/texto.ts` — el mismo idioma NFD que
`mockUsuariosService` ya usaba para generar correos — y se aplicó en las siete.

**Verificado:** `Clinica` → 9 resultados · `Ramirez` → Carlos Ramírez ·
`america` → 5 cotizaciones de Clínica Las Américas.

---

### ISSUE-002 · Alto · Cliente y Diagnóstico desaparecían bajo 1024 px — **ARREGLADO** (`f41c5aa`)

`grid-cols-[38px_86px_1.25fr_1.05fr_96px_104px_1.5fr_148px_100px]`. Las dos
columnas de texto eran `fr` sin mínimo, así que cuando la tabla no cabía el
navegador las resolvía en **0 px**:

| Viewport | Cliente | Diagnóstico |
|---|---:|---:|
| 1440 px | ok | ok |
| 1280 px | 68 px (truncado) | 81 px (truncado) |
| **1024 px** | **0 px** | **0 px** |
| **768 px** | **0 px** | **0 px** |

Los encabezados CLIENTE y DIAGNÓSTICO INICIAL seguían ahí con la celda vacía: el
operario veía la orden sin saber de quién es. El README declaraba justamente
1280/1024/768 px como anchos verificados.

Tres cambios:
- `minmax()` con piso de 104 y 128 px en las dos columnas de texto.
- **Técnico pasa a ancho fijo** (118 px). Su celda es un botón con nombre
  variable, así que como `fr` cada fila resolvía la rejilla distinto y el
  encabezado dejaba de cuadrar con los datos.
- Un solo contenedor `overflow-auto` con encabezado *sticky*, en vez de un
  scroller horizontal y otro vertical anidados que pintaban dos barras.

**Verificado:** a 1440 la tabla entra completa y ahora se lee el nombre entero
del cliente (antes se truncaba); a 1280 / 1024 / 768 se desplaza en horizontal
dentro de la tarjeta, sin desborde de página, y las 9 rejillas comparten una
sola resolución de columnas.

---

### ISSUE-003 · Alto · El dashboard mostraba cifras que contradicen a la app — **ARREGLADO** (`b047993`)

`mockDashboardService` traía números literales que no salían de ningún dataset.
El dashboard es la primera pantalla del administrador y era la menos fiable:

| Tarjeta | Decía | Real | Fuente de verdad |
|---|---:|---:|---|
| Órdenes por estado | 14/12/8/10/3/9/22/2 | 6/6/6/6/5/5/38/8 | listado de órdenes |
| Órdenes pendientes | 12 | 6 | filtro Pendiente |
| Completadas (mes) | 148 | 38 | 80 órdenes en total |
| Técnicos disponibles | 7 / 11 | 6 / 11 | vista Técnicos |
| Pagos pendientes | 5 · $ 6.320.000 | 24 · $ 95.796.000 | vista Pagos |
| Cotizaciones pendientes | 9 · $ 24.850.000 | 17 · $ 105.894.000 | vista Cotizaciones |

Lo más llamativo: el reparto por estado implicaba **56 órdenes activas** mientras
la tarjeta de al lado, en la misma pantalla, decía **34**.

La actividad operativa citaba `OS-0142` como COMPLETADA (está reprogramada) y una
`COT-0088` con un formato de código que la app no usa. Los contadores del menú
lateral repetían el 12 y el 5.

**Verificado:** las seis tarjetas, el gráfico y los contadores del menú cuadran
ahora con el listado, Técnicos, Cotizaciones y Pagos.

---

### ISSUE-004 · Medio · Se podía programar a un técnico no disponible — **ARREGLADO** (`2f98abb`)

El selector marcaba **✕ NO DISPONIBLE** y el panel lateral mostraba *"Novedad:
incapacidad médica"* en las tres franjas del día, pero el formulario dejaba crear
la orden como PROGRAMADA igual, sin aviso. La visita quedaba agendada con alguien
que no iba a ir.

El esquema pasa a construirse con la lista de técnicos fuera de servicio
(`crearNuevaOrdenSchema`), porque esa información vive en el catálogo y no en el
formulario. Es la misma forma que ya tenían las otras dos reglas de negocio.

Solo bloquea el estado inicial *programada*: la orden se puede crear igual en
cualquier otro estado con ese técnico.

**Verificado:** con Pedro Díaz + Programada → *"Ese técnico no está disponible
hoy: elige otro o no la programes aún"* y no se crea. Con Andrés López → se crea
OS-0148, se limpia el borrador y redirige al listado filtrado.

---

### ISSUE-005 · Alto · Ver y Editar llevaban a un 404 en cada fila — **ARREGLADO** (`a046a8a`)

Las dos acciones apuntaban a `/ordenes/:id` y `/ordenes/:id/editar`, rutas que no
existen en el router: **16 enlaces muertos por página, 10 páginas**. Al hacer clic
el usuario cae en el 404, que además se pinta sin barra lateral ni superior, o sea
sin forma de volver salvo el enlace *"Ir al dashboard"*.

Se retiró la columna ACCIONES hasta que exista la vista de detalle.

**Verificado:** los únicos enlaces internos que quedan en la app son las 10 rutas
del menú, todas existentes.

---

### ISSUE-006 · Medio · Buscador global y campana no hacían nada — **ARREGLADO** (`54d8df6`)

Dos controles visibles en las 12 vistas:

- El buscador de la barra superior aceptaba texto, aceptaba Enter, y no filtraba,
  no navegaba ni abría panel alguno.
- La campana se pintaba con el punto rojo de *"hay novedades sin leer"* y al
  pulsarla no ocurría nada. No había tales novedades.

Los dos quedan deshabilitados con el motivo en el tooltip, y la campana pierde el
punto rojo. Se retiró también el atajo `⌘K` / `Ctrl+K` y su etiqueta, que
enfocaban un campo inerte.

---

### ISSUE-007 · Alto · 17 botones de cabecera no hacían nada — **ARREGLADO** (`695795d`)

Ninguno de los botones de acción de las cabeceras tenía `onClick`:

`Exportar` (Órdenes, Cotizaciones, Pagos) · `Exportar reporte` · `Exportar PDF` ·
`Exportar catálogo` · `Importar` · `Nueva cotización` · `Nuevo cliente` ·
`Nuevo servicio` · `Registrar pago` · `Agregar técnico` · `Invitar usuario` ·
`Ver agenda` · `Ver roles` · `Programar envío` · y el enlace *"¿Olvidaste tu
contraseña?"* del login, que apuntaba a `#recuperar`.

Todos se pintaban activos, con cursor de mano y hover, y al pulsarlos no pasaba
nada ni en pantalla ni en consola. Quedan deshabilitados con `PENDIENTE_BACKEND`
en el tooltip. Los dos `Nueva orden` siguen activos porque esos sí navegan.

De paso, en `Button` se cambió `disabled:pointer-events-none` por
`disabled:cursor-not-allowed`: con *pointer-events* desactivados el navegador no
muestra el tooltip, que es justo lo que explica por qué el botón está apagado.
Los hover de cada variante pasan a `enabled:hover:`.

---

### ISSUE-008 · Medio · Órdenes vive en un universo de datos distinto — **DIFERIDO** (decisión del autor)

El módulo de Órdenes usa su propia lista de clientes (Clínica San Rafael, Juan
Pérez, Ferretería El Roble) y de técnicos (Andrés López, Carlos Ruiz, Pedro Díaz,
Diana Salas), mientras Clientes, Cotizaciones, Pagos y Técnicos comparten otra
distinta (Clínica Las Américas, Alcaldía de Envigado, Carlos Ramírez, Ana Torres).

Se asigna a técnicos que no existen en el módulo Técnicos, y Reportes atribuye
41 órdenes cerradas a Ana Torres, que nunca aparece en el listado de órdenes.

No rompe ninguna función: es dato de demo. El arreglo sería mover los catálogos a
`shared/` y que los cinco módulos lean de ahí. Queda anotado en el README.

---

### ISSUE-009 · Bajo · Tendencia y Reportes no cuadran con las 80 órdenes — **DIFERIDO**

La serie de tendencia del dashboard suma **171 órdenes creadas en 14 días** sobre
un sistema de 80, y el donut de Reportes reparte **200 órdenes del período** con
148 completadas. Ambos son datasets propios, decorativos. Anotado en el README.

---

## Falsas alarmas (comprobadas, no son fallos)

- **Deshacer del cambio de estado.** El primer intento pareció no revertir; era
  que el toast ya se había auto-cerrado y el clic no llegó al botón. Repetido con
  clic por referencia, revierte correctamente.
- **Cuenta inactiva sin error.** Varios intentos parecían no mostrar nada; los
  clics por coordenada estaban fallando. Disparando el submit de verdad muestra
  *"La cuenta está inactiva. Contacta al administrador del portal."*
- **Contraste del menú en tema claro.** Se ve tenue en captura reducida, pero es
  `#475569` sobre blanco: 7,5:1, pasa AAA.
- **Solo 2 credenciales de prueba en el login** frente a 3 en el README. Es
  intencional: el panel filtra por usuarios activos y `ana.suarez` está inactiva
  a propósito, para poder probar ese camino.

---

## Verificación final

- 11 rutas renderizan, **0 errores de consola** en pestaña limpia.
- 0 enlaces internos rotos.
- 0 desbordes horizontales de página en ninguna vista.
- La rejilla del listado resuelve una sola combinación de columnas a 768, 1024,
  1280 y 1440 px, en claro y oscuro.
- `npx tsc -b` limpio · `npx oxlint` limpio · `npm run build` correcto
  (569 kB / 171 kB gzip).

## Notas

- El repositorio del proyecto se creó en este QA (`git init` dentro de
  `RVR DEV`). Antes estaba sin trackear dentro del repo de `C:\Users\ANDRES`.
  Commit base: `ec58106`.
- Los datos son en memoria: crear una orden o cambiar un estado no sobrevive a
  recargar la página. Es lo esperado en modo mock.
