-- ============================================================================
--  Portal RvR Tecnologías · KPI A3 · Servicios más solicitados
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- Se cuentan todas las órdenes, no solo las cerradas: lo que mide es la
-- demanda. Las canceladas quedan fuera porque nunca llegaron a ser demanda
-- atendible.
--
-- Se cuenta sobre `orden_servicio_detalle`: una orden puede traer varios
-- servicios y cada uno cuenta. El valor sale del precio COPIADO en el detalle,
-- no del de lista, así que no cambia si mañana sube el catálogo.

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
