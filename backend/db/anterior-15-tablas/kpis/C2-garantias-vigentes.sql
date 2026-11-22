-- ============================================================================
--  Portal RvR Tecnologías · KPI GARANTÍAS · Servicios entregados que siguen en garantía
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- Es la pregunta que el modelo de 11 tablas no podía responder: "¿esta orden
-- todavía tiene garantía?". La garantía se cuenta desde la entrega y por cada
-- servicio de la orden, con los días COPIADOS al detalle: si el catálogo cambia
-- la garantía mañana, lo ya entregado conserva la que se le prometió.

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
