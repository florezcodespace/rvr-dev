-- ============================================================================
--  Portal RvR Tecnologías · KPI A2 · Órdenes por estado
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- Con el porcentaje sobre el total. El ORDER BY usa la posición del estado en
-- el flujo del negocio, no el alfabeto: así la tabla se lee como el proceso.

SELECT
  o.estado,
  count(*)                                                           AS ordenes,
  round(100.0 * count(*) / sum(count(*)) OVER (), 1)                 AS porcentaje
FROM ordenes_servicio o
GROUP BY o.estado
-- `estado` es un ENUM declarado en el orden del flujo: ordenar por él ya es
-- ordenar por el proceso, sin listas auxiliares.
ORDER BY o.estado;
