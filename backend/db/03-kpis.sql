-- ============================================================================
--  Portal RvR Tecnologías · Consultas de los indicadores   (PostgreSQL · v6)
--
--  Las mismas cuentas que hace la API para Reportes (HU_60, HU_61),
--  Indicadores (HU_63, HU_64) y Estadísticas (HU_65), escritas para correrlas
--  a mano en pgAdmin o psql y comprobar que el tablero dice la verdad.
--
--  Cómo correrlas en pgAdmin: Query Tool sobre la base `rvr`, selecciona una
--  consulta y pulsa F5 (si ejecutas todo el archivo solo verás la última).
--
--  El período está en el CTE `periodo` de cada consulta: por defecto, los
--  últimos 30 días. Todas son SELECT: no escriben nada.
--
--  Este archivo NO lo carga montar-base.bat; es solo de consulta.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- HU_63 · Servicios realizados
-- Un servicio realizado es un ítem de orden en estado «completado» dentro de
-- una orden finalizada. Se cuenta por la fecha en que la orden se finalizó
-- (historial_orden), no por la de creación.
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta),
fin AS (
  SELECT orden_id, max(fecha) AS fecha
    FROM historial_orden WHERE estado_nuevo = 'finalizada' GROUP BY orden_id
)
SELECT count(*)                         AS servicios_realizados,
       count(DISTINCT o.id)             AS ordenes_finalizadas,
       coalesce(sum(dc.cantidad), 0)    AS unidades
  FROM orden o
  JOIN fin f               ON f.orden_id = o.id
  JOIN detalle_orden d     ON d.orden_id = o.id AND d.estado_item = 'completado'
  JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id AND dc.tipo_item = 'servicio'
  CROSS JOIN periodo p
 WHERE o.estado = 'finalizada' AND f.fecha >= p.desde AND f.fecha < p.hasta;


-- ---------------------------------------------------------------------------
-- HU_63 · Órdenes por estado (cantidad y porcentaje), creadas en el período
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT o.estado,
       count(*) AS ordenes,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS porcentaje
  FROM orden o CROSS JOIN periodo p
 WHERE o.fecha_creacion >= p.desde AND o.fecha_creacion < p.hasta
 GROUP BY o.estado
 ORDER BY array_position(ARRAY['esperando_anticipo','en_proceso','en_espera_repuesto','finalizada','cancelada']::varchar[], o.estado);


-- ---------------------------------------------------------------------------
-- HU_64 · Servicios más solicitados (unidades cotizadas en el período)
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT s.nombre, s.categoria,
       sum(dc.cantidad)                 AS unidades,
       count(DISTINCT dc.cotizacion_id) AS cotizaciones
  FROM detalle_cotizacion dc
  JOIN servicio s   ON s.id = dc.servicio_id
  JOIN cotizacion c ON c.id = dc.cotizacion_id
  CROSS JOIN periodo p
 WHERE c.fecha_cotizacion >= p.desde AND c.fecha_cotizacion < p.hasta
 GROUP BY s.id
 ORDER BY unidades DESC, s.nombre
 LIMIT 10;


-- ---------------------------------------------------------------------------
-- HU_64 · Técnicos con más visitas cumplidas en el período
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT t.nombres || ' ' || t.apellidos AS tecnico,
       count(*)                        AS visitas_cumplidas,
       count(DISTINCT a.orden_id)      AS ordenes
  FROM agendamiento a
  JOIN tecnico t ON t.id = a.tecnico_id
  CROSS JOIN periodo p
 WHERE a.estado = 'cumplida' AND a.fecha_programada >= p.desde AND a.fecha_programada < p.hasta
 GROUP BY t.id
 ORDER BY visitas_cumplidas DESC;


-- ---------------------------------------------------------------------------
-- HU_60 · Reporte de órdenes de servicio del período
-- Código, cliente, servicios, técnico de la última visita, fecha, monto y estado.
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT o.codigo_orden,
       cl.nombres || ' ' || cl.apellidos AS cliente,
       (SELECT string_agg(coalesce(s.nombre, dc.descripcion), ', ')
          FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
          LEFT JOIN servicio s ON s.id = dc.servicio_id
         WHERE d.orden_id = o.id)                                   AS servicios,
       (SELECT t.nombres || ' ' || t.apellidos FROM agendamiento a JOIN tecnico t ON t.id = a.tecnico_id
         WHERE a.orden_id = o.id ORDER BY a.fecha_programada DESC LIMIT 1) AS tecnico,
       o.fecha_creacion::date                                        AS fecha,
       v.monto_total,
       o.estado
  FROM orden o
  JOIN v_orden_cliente oc ON oc.orden_id = o.id
  JOIN cliente cl         ON cl.id = oc.cliente_id
  LEFT JOIN ventas v      ON v.orden_id = o.id
  CROSS JOIN periodo p
 WHERE o.fecha_creacion >= p.desde AND o.fecha_creacion < p.hasta
 ORDER BY o.fecha_creacion;


-- ---------------------------------------------------------------------------
-- HU_61 · Servicios por técnico: visitas, órdenes finalizadas y valor atendido
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT t.nombres || ' ' || t.apellidos                          AS tecnico,
       count(a.id)                                              AS visitas,
       count(a.id) FILTER (WHERE a.estado = 'cumplida')         AS cumplidas,
       count(DISTINCT a.orden_id) FILTER (WHERE o.estado = 'finalizada') AS ordenes_finalizadas
  FROM tecnico t
  LEFT JOIN agendamiento a ON a.tecnico_id = t.id
        AND a.fecha_programada >= (SELECT desde FROM periodo) AND a.fecha_programada < (SELECT hasta FROM periodo)
  LEFT JOIN orden o ON o.id = a.orden_id
 GROUP BY t.id
 ORDER BY cumplidas DESC, tecnico;


-- ---------------------------------------------------------------------------
-- HU_65 · Ingresos del período (abonos de ventas no anuladas, CA_65_02)
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT coalesce(sum(a.monto), 0) AS ingresos,
       count(*)                  AS abonos
  FROM abonos a
  JOIN ventas v ON v.id = a.venta_id AND v.estado_pago <> 'anulada'
  CROSS JOIN periodo p
 WHERE a.fecha_abono >= p.desde AND a.fecha_abono < p.hasta;


-- ---------------------------------------------------------------------------
-- HU_65 · Tasa de aprobación de cotizaciones respondidas en el período
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT count(*) FILTER (WHERE estado = 'aprobada')  AS aprobadas,
       count(*) FILTER (WHERE estado = 'rechazada') AS rechazadas,
       round(100.0 * count(*) FILTER (WHERE estado = 'aprobada') / nullif(count(*), 0), 1) AS tasa_aprobacion
  FROM cotizacion c CROSS JOIN periodo p
 WHERE c.estado IN ('aprobada', 'rechazada')
   AND c.fecha_respuesta >= p.desde AND c.fecha_respuesta < p.hasta;


-- ---------------------------------------------------------------------------
-- Cartera por cobrar: saldo de las ventas vigentes, por cliente
-- ---------------------------------------------------------------------------
SELECT cl.nombres || ' ' || cl.apellidos AS cliente,
       count(*)                          AS ventas_con_saldo,
       sum(v.saldo)                      AS saldo
  FROM v_ventas v
  JOIN cliente cl ON cl.id = v.cliente_id
 WHERE v.estado_pago <> 'anulada' AND v.saldo > 0
 GROUP BY cl.id
 ORDER BY saldo DESC;


-- ---------------------------------------------------------------------------
-- Pendientes de hoy (tarjeta del tablero)
-- ---------------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM cotizacion WHERE estado = 'solicitada')                 AS solicitudes_por_valorar,
  (SELECT count(*) FROM cotizacion WHERE estado = 'pendiente')                  AS esperando_al_cliente,
  (SELECT count(*) FROM orden WHERE estado = 'esperando_anticipo')              AS esperando_anticipo,
  (SELECT count(*) FROM orden WHERE estado = 'en_espera_repuesto')              AS en_espera_repuesto,
  (SELECT count(*) FROM orden o WHERE o.estado IN ('en_proceso', 'esperando_anticipo')
      AND NOT EXISTS (SELECT 1 FROM agendamiento a WHERE a.orden_id = o.id AND a.estado = 'pendiente')) AS activas_sin_visita;


-- ---------------------------------------------------------------------------
-- Agenda de los próximos 7 días
-- ---------------------------------------------------------------------------
SELECT a.fecha_programada, t.nombres || ' ' || t.apellidos AS tecnico, o.codigo_orden,
       cl.nombres || ' ' || cl.apellidos AS cliente, cl.direccion
  FROM agendamiento a
  JOIN tecnico t          ON t.id = a.tecnico_id
  JOIN orden o            ON o.id = a.orden_id
  JOIN v_orden_cliente oc ON oc.orden_id = o.id
  JOIN cliente cl         ON cl.id = oc.cliente_id
 WHERE a.estado = 'pendiente'
   AND a.fecha_programada >= current_date AND a.fecha_programada < current_date + 7
 ORDER BY a.fecha_programada;


-- ---------------------------------------------------------------------------
-- Ingresos por medio de pago (período)
-- ---------------------------------------------------------------------------
WITH periodo AS (SELECT current_date - 29 AS desde, current_date + 1 AS hasta)
SELECT a.metodo_pago, count(*) AS abonos, sum(a.monto) AS total
  FROM abonos a
  JOIN ventas v ON v.id = a.venta_id AND v.estado_pago <> 'anulada'
  CROSS JOIN periodo p
 WHERE a.fecha_abono >= p.desde AND a.fecha_abono < p.hasta
 GROUP BY a.metodo_pago
 ORDER BY total DESC;
