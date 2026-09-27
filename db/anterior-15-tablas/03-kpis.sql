-- ============================================================================
--  Portal RvR Tecnologías · Consultas de los KPIs   (PostgreSQL)
--
--  Modelo corregido de 15 tablas. Catorce consultas: las cuatro que exige el
--  subproceso de Reportes de la ficha técnica, las ocho del tablero del portal,
--  la distribución por medio de pago y las garantías vigentes.
--
--  Cómo correrlas en pgAdmin: abre el Query Tool sobre la base `rvr`, pega una
--  consulta a la vez y pulsa F5. Si pegas el archivo completo, pgAdmin solo te
--  muestra el resultado de la última; seleccionar el bloque y pulsar F5 ejecuta
--  únicamente lo seleccionado.
--
--  El período se cambia en un solo sitio: el CTE `periodo` que abre cada
--  consulta que lo necesita. Por defecto son los últimos 30 días.
--
--  Ninguna consulta escribe. Son todas SELECT y se pueden correr sin miedo
--  sobre la base de producción.
-- ============================================================================


-- ############################################################################
--  A. LOS CUATRO KPI DE LA FICHA TÉCNICA
-- ############################################################################

-- ---------------------------------------------------------------------------
-- A1 · Cantidad de servicios realizados
--
-- "Realizado" = orden en estado completada. Se cuenta por la fecha de entrega
-- y no por la de ingreso: una orden que entró en agosto y se cerró en
-- septiembre es un servicio realizado en septiembre.
-- ---------------------------------------------------------------------------
WITH periodo AS (
  SELECT current_date - interval '30 days' AS desde,
         current_date + interval '1 day'   AS hasta
)
SELECT
  count(*)                                             AS servicios_realizados,
  count(DISTINCT o.cliente_id)                         AS clientes_atendidos,
  count(DISTINCT o.tecnico_id)                         AS tecnicos_participantes,
  round(avg(extract(epoch FROM (o.fecha_entrega - o.fecha_ingreso)) / 86400), 1)
                                                       AS dias_promedio_de_cierre
FROM ordenes_servicio o, periodo p
WHERE o.estado = 'completada'
  AND o.fecha_entrega >= p.desde
  AND o.fecha_entrega <  p.hasta;


-- ---------------------------------------------------------------------------
-- A2 · Órdenes por estado
--
-- Con el porcentaje sobre el total. El ORDER BY usa la posición del estado en
-- el flujo del negocio, no el alfabeto: así la tabla se lee como el proceso.
-- ---------------------------------------------------------------------------
SELECT
  o.estado,
  count(*)                                                           AS ordenes,
  round(100.0 * count(*) / sum(count(*)) OVER (), 1)                 AS porcentaje
FROM ordenes_servicio o
GROUP BY o.estado
-- `estado` es un ENUM declarado en el orden del flujo: ordenar por él ya es
-- ordenar por el proceso, sin listas auxiliares.
ORDER BY o.estado;


-- ---------------------------------------------------------------------------
-- A3 · Servicios más solicitados
--
-- Se cuentan todas las órdenes, no solo las cerradas: lo que mide es la
-- demanda. Las canceladas quedan fuera porque nunca llegaron a ser demanda
-- atendible.
--
-- Se cuenta sobre `orden_servicio_detalle`: una orden puede traer varios
-- servicios y cada uno cuenta. El valor sale del precio COPIADO en el detalle,
-- no del de lista, así que no cambia si mañana sube el catálogo.
-- ---------------------------------------------------------------------------
SELECT
  s.nombre                                                    AS servicio,
  c.nombre                                                    AS categoria,
  count(DISTINCT d.orden_id)                                  AS ordenes_que_lo_piden,
  sum(d.cantidad)                                             AS unidades,
  count(DISTINCT d.orden_id) FILTER (WHERE o.estado = 'completada')
                                                              AS ordenes_completadas,
  sum(d.subtotal)                                             AS valor_cotizado,
  round(100.0 * count(DISTINCT d.orden_id)
        / NULLIF((SELECT count(*) FROM ordenes_servicio
                   WHERE estado <> 'cancelada'), 0), 1)       AS pct_de_las_ordenes
FROM orden_servicio_detalle d
JOIN ordenes_servicio o ON o.id = d.orden_id AND o.estado <> 'cancelada'
JOIN servicios s        ON s.id = d.servicio_id
JOIN categorias c       ON c.id = s.categoria_id
GROUP BY s.id, s.nombre, c.nombre
ORDER BY ordenes_que_lo_piden DESC, s.nombre
LIMIT 10;


-- ---------------------------------------------------------------------------
-- A4 · Técnicos con mayor número de servicios ejecutados
--
-- `LEFT JOIN` y no `JOIN`: un técnico sin órdenes en el período tiene que
-- aparecer con cero. Con JOIN desaparecería de la lista y parecería que no
-- existe, que es justo lo que no se quiere ver en un reporte de carga.
-- ---------------------------------------------------------------------------
WITH periodo AS (
  SELECT current_date - interval '30 days' AS desde,
         current_date + interval '1 day'   AS hasta
)
SELECT
  trim(u.nombres || ' ' || u.apellidos)                             AS tecnico,
  t.especialidad,
  count(o.id)                                                       AS ordenes_asignadas,
  count(o.id) FILTER (WHERE o.estado = 'completada')                AS ejecutadas,
  count(o.id) FILTER (WHERE o.estado IN ('en_proceso','programada','reprogramada'))
                                                                    AS en_curso,
  round(
    100.0 * count(o.id) FILTER (WHERE o.estado = 'completada')
    / NULLIF(count(o.id) FILTER (WHERE o.estado <> 'cancelada'), 0), 1)
                                                                    AS cumplimiento
FROM tecnicos t
JOIN usuarios u ON u.id = t.usuario_id
LEFT JOIN ordenes_servicio o
       ON o.tecnico_id = t.id
      AND o.fecha_ingreso >= (SELECT desde FROM periodo)
      AND o.fecha_ingreso <  (SELECT hasta FROM periodo)
GROUP BY t.id, t.especialidad, u.nombres, u.apellidos
ORDER BY ejecutadas DESC, ordenes_asignadas DESC;


-- ############################################################################
--  B. LOS KPI DEL TABLERO DEL PORTAL
-- ############################################################################

-- ---------------------------------------------------------------------------
-- B1 · Ingresos del período, contra los 30 días anteriores
--
-- El ingreso es lo **abonado**, no lo facturado: una venta emitida y sin cobrar
-- no es plata que entró. Los abonos reembolsados no cuentan. La variación compara con la ventana inmediatamente
-- anterior de la misma duración.
-- ---------------------------------------------------------------------------
WITH periodo AS (
  SELECT current_date - interval '30 days' AS desde,
         current_date + interval '1 day'   AS hasta
),
ventanas AS (
  SELECT
    coalesce(sum(a.monto) FILTER (
      WHERE a.fecha_abono >= p.desde AND a.fecha_abono < p.hasta), 0)  AS actual,
    coalesce(sum(a.monto) FILTER (
      WHERE a.fecha_abono >= p.desde - (p.hasta - p.desde)
        AND a.fecha_abono <  p.desde), 0)                              AS anterior
  FROM abonos a, periodo p
  WHERE a.estado <> 'reembolsado'
)
SELECT
  actual                                                       AS ingresos_periodo,
  anterior                                                     AS ingresos_periodo_previo,
  actual - anterior                                            AS diferencia,
  CASE WHEN anterior = 0 THEN NULL
       ELSE round(100.0 * (actual - anterior) / anterior, 1) END AS variacion_pct
FROM ventanas;


-- ---------------------------------------------------------------------------
-- B2 · Órdenes completadas del período  ("38 / 80")
-- ---------------------------------------------------------------------------
WITH periodo AS (
  SELECT current_date - interval '30 days' AS desde,
         current_date + interval '1 day'   AS hasta
)
SELECT
  count(*) FILTER (WHERE o.estado = 'completada')                    AS completadas,
  count(*)                                                           AS ordenes_del_periodo,
  round(100.0 * count(*) FILTER (WHERE o.estado = 'completada')
        / NULLIF(count(*), 0), 1)                                    AS porcentaje
FROM ordenes_servicio o, periodo p
WHERE o.fecha_ingreso >= p.desde AND o.fecha_ingreso < p.hasta;


-- ---------------------------------------------------------------------------
-- B3 · Órdenes activas y cuántas van sin técnico
--
-- "Activa" = ni completada ni cancelada. Sin período: lo que está abierto hoy
-- importa aunque haya entrado hace tres meses; de hecho, eso es lo que más
-- importa.
-- ---------------------------------------------------------------------------
SELECT
  count(*)                                                     AS ordenes_activas,
  count(*) FILTER (WHERE o.tecnico_id IS NULL)                 AS sin_tecnico,
  count(*) FILTER (WHERE o.fecha_ingreso < current_date - interval '3 days'
                     AND o.estado = 'pendiente')               AS pendientes_mas_de_3_dias
FROM ordenes_servicio o
WHERE o.estado NOT IN ('completada', 'cancelada');


-- ---------------------------------------------------------------------------
-- B4 · Cartera recaudada
--
-- Sale de la vista `v_ventas`, que ya trae el abonado y el saldo de cada venta.
-- Por dentro usa `LEFT JOIN LATERAL` para sumar los abonos sin multiplicar las
-- filas: con un JOIN normal a `abonos`, una venta con tres abonos contaría su
-- `monto_total` tres veces y el facturado saldría inflado.
-- Las ventas anuladas no son cartera.
-- ---------------------------------------------------------------------------
SELECT
  coalesce(sum(v.monto_total), 0)                              AS facturado,
  coalesce(sum(v.abonado), 0)                                  AS recaudado,
  coalesce(sum(v.saldo), 0)                                    AS por_cobrar,
  round(100.0 * sum(v.abonado) / NULLIF(sum(v.monto_total), 0), 1)
                                                               AS porcentaje_recaudado,
  count(*)                                                     AS ventas,
  count(*) FILTER (WHERE v.saldo > 0)                          AS ventas_con_saldo
FROM v_ventas v
WHERE v.estado = 'vigente';


-- ---------------------------------------------------------------------------
-- B5 · Tendencia de 14 días: creadas contra completadas
--
-- `generate_series` primero y los conteos después. Sin la serie, un día sin
-- órdenes simplemente no aparece: el eje se comprime y la línea miente sobre
-- la pendiente.
-- ---------------------------------------------------------------------------
WITH dias AS (
  SELECT generate_series(current_date - interval '13 days',
                         current_date,
                         interval '1 day')::date AS dia
)
SELECT
  d.dia,
  -- Etiqueta en español sin depender de `lc_time`: el idioma del servidor no
  -- es el mismo en Neon, en Windows y en el equipo de cada quien, y `to_char`
  -- con 'TM' devolvería "Sep"/"Dec" según dónde corra.
  to_char(d.dia, 'DD') || ' ' || (ARRAY['ene','feb','mar','abr','may','jun',
    'jul','ago','sep','oct','nov','dic'])[extract(month FROM d.dia)::int]
                                                                      AS etiqueta,
  count(*) FILTER (WHERE o.fecha_ingreso::date = d.dia)               AS creadas,
  count(*) FILTER (WHERE o.fecha_entrega::date = d.dia
                     AND o.estado = 'completada')                     AS completadas
FROM dias d
LEFT JOIN ordenes_servicio o
       ON o.fecha_ingreso::date = d.dia
       OR (o.fecha_entrega::date = d.dia AND o.estado = 'completada')
GROUP BY d.dia
ORDER BY d.dia;


-- ---------------------------------------------------------------------------
-- B6 · Pipeline de órdenes: los ocho estados agrupados como los pinta el portal
-- ---------------------------------------------------------------------------
SELECT
  grupo,
  sum(ordenes)                                                 AS ordenes,
  round(100.0 * sum(ordenes) / NULLIF(sum(sum(ordenes)) OVER (), 0), 1) AS porcentaje
FROM (
  SELECT
    CASE
      WHEN o.estado IN ('nueva', 'pendiente', 'aprobada')      THEN 'Pendiente'
      WHEN o.estado IN ('programada', 'reprogramada',
                        'en_proceso')                          THEN 'En proceso'
      WHEN o.estado = 'completada'                             THEN 'Finalizada'
      ELSE                                                          'Cancelada'
    END        AS grupo,
    count(*)   AS ordenes
  FROM ordenes_servicio o
  GROUP BY 1
) x
GROUP BY grupo
ORDER BY array_position(
  ARRAY['Pendiente','En proceso','Finalizada','Cancelada'], grupo);


-- ---------------------------------------------------------------------------
-- B7 · Estado de cartera por cliente
--
-- Quién debe, cuánto y desde cuándo. Es la consulta que sostiene la tarjeta de
-- cartera y la que sirve para llamar a cobrar.
-- ---------------------------------------------------------------------------
SELECT
  c.nombre                                                     AS cliente,
  c.telefono,
  count(v.id)                                                  AS ventas,
  sum(v.monto_total)                                           AS facturado,
  sum(v.abonado)                                               AS abonado,
  sum(v.saldo)                                                 AS saldo,
  max(current_date - v.fecha_venta::date) FILTER (WHERE v.saldo > 0)
                                                               AS dias_del_saldo_mas_viejo
FROM v_ventas v
JOIN clientes c ON c.id = v.cliente_id
WHERE v.estado = 'vigente'
GROUP BY c.id, c.nombre, c.telefono
HAVING sum(v.saldo) > 0
ORDER BY saldo DESC;


-- ---------------------------------------------------------------------------
-- B8 · Agenda de visitas de los próximos 7 días
-- ---------------------------------------------------------------------------
WITH dias AS (
  SELECT generate_series(current_date, current_date + interval '6 days',
                         interval '1 day')::date AS dia
)
SELECT
  d.dia,
  -- Mismo motivo: el nombre del día se arma con el número de día de la semana.
  (ARRAY['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'])[extract(dow FROM d.dia)::int + 1]
                                                                      AS etiqueta,
  CASE WHEN d.dia = current_date THEN 'HOY' ELSE '' END                AS marca,
  count(a.id)                                                         AS visitas,
  count(DISTINCT a.tecnico_id)                                        AS tecnicos
FROM dias d
LEFT JOIN agendamientos a
       ON a.fecha_programada::date = d.dia
      AND a.estado <> 'cancelado'
GROUP BY d.dia
ORDER BY d.dia;


-- ---------------------------------------------------------------------------
-- BONO · Distribución por medio de pago
--
-- El medio es ahora un catálogo (`metodos_pago`), así que agrupar es un JOIN
-- y no hay que normalizar texto. El LEFT JOIN muestra también los medios que
-- no se han usado, con cero.
-- ---------------------------------------------------------------------------
SELECT
  m.nombre                                                     AS medio_de_pago,
  count(a.id)                                                  AS abonos,
  coalesce(sum(a.monto), 0)                                    AS total,
  round(100.0 * coalesce(sum(a.monto), 0)
        / NULLIF(sum(sum(a.monto)) OVER (), 0), 1)             AS porcentaje
FROM metodos_pago m
LEFT JOIN abonos a ON a.metodo_pago_id = m.id AND a.estado <> 'reembolsado'
GROUP BY m.id, m.nombre
ORDER BY total DESC, m.nombre;


-- ---------------------------------------------------------------------------
-- GARANTÍAS · Servicios entregados que siguen en garantía
--
-- Es la pregunta que el modelo de 11 tablas no podía responder: "¿esta orden
-- todavía tiene garantía?". La garantía se cuenta desde la entrega y por cada
-- servicio de la orden, con los días COPIADOS al detalle: si el catálogo cambia
-- la garantía mañana, lo ya entregado conserva la que se le prometió.
-- ---------------------------------------------------------------------------
SELECT
  'OS-' || lpad(o.id::text, 4, '0')                            AS orden,
  c.nombre                                                     AS cliente,
  s.nombre                                                     AS servicio,
  o.fecha_entrega::date                                        AS entregado,
  (o.fecha_entrega + d.dias_garantia * interval '1 day')::date AS garantia_hasta,
  (o.fecha_entrega::date + d.dias_garantia) - current_date     AS dias_restantes
FROM ordenes_servicio o
JOIN orden_servicio_detalle d ON d.orden_id = o.id
JOIN servicios s              ON s.id = d.servicio_id
JOIN clientes c               ON c.id = o.cliente_id
WHERE o.estado = 'completada'
  AND d.dias_garantia > 0
  AND o.fecha_entrega::date + d.dias_garantia >= current_date
ORDER BY dias_restantes, orden;
