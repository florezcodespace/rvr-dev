-- ============================================================================
--  Portal RvR Tecnologías · KPI A4 · Técnicos con mayor número de servicios ejecutados
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- `LEFT JOIN` y no `JOIN`: un técnico sin órdenes en el período tiene que
-- aparecer con cero. Con JOIN desaparecería de la lista y parecería que no
-- existe, que es justo lo que no se quiere ver en un reporte de carga.

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
