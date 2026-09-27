-- ============================================================================
--  Portal RvR Tecnologías · KPI A1 · Cantidad de servicios realizados
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- "Realizado" = orden en estado completada. Se cuenta por la fecha de entrega
-- y no por la de ingreso: una orden que entró en agosto y se cerró en
-- septiembre es un servicio realizado en septiembre.

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
