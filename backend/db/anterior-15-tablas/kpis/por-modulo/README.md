# KPIs y consultas por módulo

Un archivo `.sql` por pantalla del portal. Cada bloque está rotulado con la
tarjeta, la gráfica o la tabla que alimenta, así que la captura de pantalla del
resultado se puede poner al lado de la captura del portal y se ve que dan la
misma cifra.

**Todas las consultas son `SELECT`: ninguna cambia ni borra nada.**

## Cómo ejecutarlas

En **pgAdmin**: abre la base `rvr` → *Query Tool* → pega el archivo → selecciona
con el mouse el bloque que quieras y pulsa **F5**. Si ejecutas todo el archivo de
una vez, pgAdmin solo muestra el resultado de la última consulta.

En **psql**:

```
psql -U postgres -d rvr -f db/kpis/por-modulo/dashboard.sql
```

## Qué hay en cada archivo

| Archivo | Pantalla | Qué contiene |
|---|---|---|
| `dashboard.sql` | Tablero `/panel` | Ingresos del período, órdenes completadas, activas sin técnico, cartera recaudada, encabezado del día, tendencia de 14 días, pipeline por estado, agenda de 7 días y la lista de actividad reciente |
| `ordenes.sql` | Órdenes `/ordenes` | Encabezado (total y activas), el listado con cliente/técnico/próxima visita, el detalle completo de una orden (servicios, visitas, diagnósticos, venta y pagos), la garantía y los catálogos de los filtros |
| `clientes.sql` | Clientes `/clientes` | Clientes activos, nuevos del mes, con saldo y su valor, facturación del año, pestañas, listado, ficha del cliente y la cartera por cliente |
| `tecnicos.sql` | Técnicos `/tecnicos` | Disponibles ahora, en ruta o en sitio, visitas de hoy y promedio por técnico, cumplimiento SLA, listado, ficha (agenda y órdenes) y el ranking de cierres |
| `servicios.sql` | Servicios `/servicios` | Publicados y borradores, el más solicitado, ingreso del mes, duración promedio, pestañas por categoría, ficha del servicio y qué deja cada uno |
| `pagos.sql` | Pagos `/pagos` | Recaudado del mes contra la meta, por conciliar y su valor, días de cobro, recaudo de 6 meses, medios de pago, listado, ficha del pago y el estado de pago de cada venta |
| `usuarios.sql` | Usuarios `/usuarios` | Cuentas activas, administradores, invitaciones pendientes, sin ingresar hace 30 días, pestañas por rol, listado y la matriz de permisos por rol |
| `reportes.sql` | Reportes `/reportes` | Las cifras del período con su variación contra el período anterior, el cumplimiento del SLA, la serie de 11 tramos, el pipeline, los servicios más pedidos y los técnicos con más cierres |

En la carpeta de arriba (`db/kpis/`) están los 14 KPIs sueltos (`A1`, `B5`, `C2`…)
por si se necesita uno solo sin el contexto de su pantalla.

## Tres cosas que conviene saber para sustentarlas

**El ingreso es lo abonado, no lo facturado.** Una venta emitida y sin cobrar
todavía no es plata que entró, así que los ingresos salen de `abonos` y la
cartera de la vista `v_ventas`.

**El precio se copia al crear la orden.** `orden_servicio_detalle` guarda el
`precio_unitario` y los `dias_garantia` del momento; subir el precio del catálogo
hoy no cambia lo que se cobró ayer. Por eso lo facturado se suma del detalle y
nunca de `servicios.precio`.

**Las series de tiempo se generan primero.** `generate_series` produce todos los
días o meses del rango y los conteos se pegan encima. Sin eso, un día sin órdenes
desaparece del eje y la línea miente sobre la pendiente. Lo mismo hace
`enum_range(NULL::estado_orden)` con el pipeline: los estados en cero también
salen, y en el orden del flujo, no del alfabeto.

## Nota sobre los períodos

- `dashboard.sql` usa 30 días. Cambia el `30` de cada consulta para otro rango.
- `reportes.sql` usa 90 días (`90d` en el portal). Cámbialo por `30`, `180` o
  `365` para los demás rangos.
- Donde una consulta es de una ficha (`/ordenes/:id`, `/clientes/:id`…), el id de
  ejemplo está escrito en el `WHERE`; cámbialo por el registro que quieras ver.
