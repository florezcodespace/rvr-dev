-- ============================================================================
--  Portal RvR Tecnologías · KPI B2 · Órdenes completadas del período  ("38 / 80")
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:

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
