-- ============================================================================
--  Portal RvR Tecnologías · KPI B6 · Pipeline de órdenes: los ocho estados agrupados como los pinta el portal
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:

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
