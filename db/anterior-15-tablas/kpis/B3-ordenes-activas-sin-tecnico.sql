-- ============================================================================
--  Portal RvR Tecnologías · KPI B3 · Órdenes activas y cuántas van sin técnico
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- "Activa" = ni completada ni cancelada. Sin período: lo que está abierto hoy
-- importa aunque haya entrado hace tres meses; de hecho, eso es lo que más
-- importa.

SELECT
  count(*)                                                     AS ordenes_activas,
  count(*) FILTER (WHERE o.tecnico_id IS NULL)                 AS sin_tecnico,
  count(*) FILTER (WHERE o.fecha_ingreso < current_date - interval '3 days'
                     AND o.estado = 'pendiente')               AS pendientes_mas_de_3_dias
FROM ordenes_servicio o
WHERE o.estado NOT IN ('completada', 'cancelada');
