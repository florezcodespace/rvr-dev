-- ============================================================================
--  Portal RvR Tecnologías · KPI B7 · Estado de cartera por cliente
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- Quién debe, cuánto y desde cuándo. Es la consulta que sostiene la tarjeta de
-- cartera y la que sirve para llamar a cobrar.

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
