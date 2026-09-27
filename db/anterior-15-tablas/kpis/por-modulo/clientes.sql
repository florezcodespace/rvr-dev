-- ============================================================================
--  Módulo Clientes · /clientes
--
--  Las cuatro tarjetas, el listado y la ficha, tal como las ejecuta
--  `api/src/modulos/clientes.ts`. Todas son SELECT.
--
--  Idea clave: "con saldo" NO se guarda en la tabla. La tabla solo sabe si el
--  cliente está activo o inactivo; el saldo sale de `v_ventas`, así Clientes y
--  Pagos nunca se contradicen.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- BASE · El cliente con sus agregados (la usan las tarjetas y el listado)
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT c.id, c.nombre,
         c.tipo_documento::text || ' ' || c.numero_documento        AS documento,
         coalesce(c.sector, '')                                      AS sector,
         coalesce(c.ciudad, '')                                      AS ciudad,
         coalesce(o.ordenes, 0)::int                                 AS ordenes,
         coalesce(v.facturado, 0)                                    AS facturacion,
         coalesce(v.saldo, 0)                                        AS saldo,
         CASE WHEN c.estado = 'inactivo'    THEN 'inactivo'
              WHEN coalesce(v.saldo, 0) > 0 THEN 'con_saldo'
              ELSE                               'activo' END        AS estado,
         c.fecha_creacion
    FROM clientes c
    LEFT JOIN LATERAL (
      SELECT count(*) AS ordenes, max(fecha_ingreso) AS ultima
        FROM ordenes_servicio WHERE cliente_id = c.id
    ) o ON true
    LEFT JOIN LATERAL (
      SELECT sum(monto_total) AS facturado, sum(saldo) AS saldo
        FROM v_ventas WHERE cliente_id = c.id AND estado = 'vigente'
    ) v ON true
)
-- TARJETAS 1 a 4 · activos · nuevos del mes · con saldo (+ valor) · facturación
SELECT
  count(*) FILTER (WHERE estado = 'activo')::int                     AS clientes_activos,
  count(*)::int                                                      AS total,
  count(*) FILTER (WHERE fecha_creacion >= date_trunc('month', now()))::int
                                                                     AS nuevos_este_mes,
  count(*) FILTER (WHERE estado = 'con_saldo')::int                  AS con_saldo,
  coalesce(sum(saldo), 0)                                            AS valor_del_saldo,
  (SELECT coalesce(sum(monto_total), 0) FROM v_ventas
    WHERE estado = 'vigente'
      AND fecha_venta >= date_trunc('year', now()))                  AS facturacion_del_ano
FROM base;


-- ---------------------------------------------------------------------------
-- PESTAÑAS · Todos / Activos / Con saldo / Inactivos
-- ---------------------------------------------------------------------------
SELECT
  CASE WHEN c.estado = 'inactivo' THEN 'inactivo'
       WHEN coalesce((SELECT sum(saldo) FROM v_ventas
                       WHERE cliente_id = c.id AND estado = 'vigente'), 0) > 0
         THEN 'con_saldo'
       ELSE 'activo' END          AS pestana,
  count(*)::int                   AS clientes
FROM clientes c
GROUP BY 1
ORDER BY 1;


-- ---------------------------------------------------------------------------
-- LISTADO · Lo que se ve en la tabla
-- ---------------------------------------------------------------------------
SELECT c.nombre,
       c.tipo_documento::text || ' ' || c.numero_documento AS documento,
       coalesce(c.sector, '')                              AS sector,
       (SELECT count(*) FROM ordenes_servicio WHERE cliente_id = c.id)::int AS ordenes,
       coalesce((SELECT sum(monto_total) FROM v_ventas
                  WHERE cliente_id = c.id AND estado = 'vigente'), 0)       AS facturacion,
       coalesce((SELECT sum(saldo) FROM v_ventas
                  WHERE cliente_id = c.id AND estado = 'vigente'), 0)       AS saldo,
       (SELECT max(fecha_ingreso) FROM ordenes_servicio
         WHERE cliente_id = c.id)::date                                     AS ultima_orden
FROM clientes c
ORDER BY ultima_orden DESC NULLS LAST, c.nombre
LIMIT 12;


-- ---------------------------------------------------------------------------
-- FICHA DEL CLIENTE · /clientes/:id  (cambia el 1 por el id que quieras)
-- ---------------------------------------------------------------------------

-- Resumen de la ficha: órdenes, facturado, abonado y saldo
SELECT
  (SELECT count(*) FROM ordenes_servicio WHERE cliente_id = 1)::int          AS ordenes,
  (SELECT count(*) FROM ordenes_servicio
    WHERE cliente_id = 1 AND estado NOT IN ('completada', 'cancelada'))::int AS activas,
  (SELECT count(*) FROM ordenes_servicio
    WHERE cliente_id = 1 AND estado = 'completada')::int                     AS completadas,
  (SELECT coalesce(sum(monto_total), 0) FROM v_ventas
    WHERE cliente_id = 1 AND estado = 'vigente')                             AS facturado,
  (SELECT coalesce(sum(abonado), 0) FROM v_ventas
    WHERE cliente_id = 1 AND estado = 'vigente')                             AS abonado,
  (SELECT coalesce(sum(saldo), 0) FROM v_ventas
    WHERE cliente_id = 1 AND estado = 'vigente')                             AS saldo;

-- Sus órdenes
SELECT 'OS-' || lpad(o.id::text, 4, '0') AS orden, o.estado, o.fecha_ingreso,
       trim(u.nombres || ' ' || u.apellidos) AS tecnico,
       (SELECT coalesce(sum(subtotal), 0) FROM orden_servicio_detalle
         WHERE orden_id = o.id) AS total
  FROM ordenes_servicio o
  LEFT JOIN tecnicos t ON t.id = o.tecnico_id
  LEFT JOIN usuarios u ON u.id = t.usuario_id
 WHERE o.cliente_id = 1
 ORDER BY o.fecha_ingreso DESC
 LIMIT 20;

-- Sus últimos pagos
SELECT 'PG-' || lpad(a.id::text, 4, '0') AS recibo, a.fecha_abono, a.monto,
       m.nombre AS medio, a.estado,
       'OS-' || lpad(v.orden_id::text, 4, '0') AS orden
  FROM abonos a
  JOIN ventas v           ON v.id = a.venta_id
  JOIN ordenes_servicio o ON o.id = v.orden_id
  JOIN metodos_pago m     ON m.id = a.metodo_pago_id
 WHERE o.cliente_id = 1
 ORDER BY a.fecha_abono DESC
 LIMIT 10;


-- ---------------------------------------------------------------------------
-- EXTRA · Cartera por cliente: quién debe, cuánto y desde hace cuánto
-- ---------------------------------------------------------------------------
SELECT c.nombre AS cliente, c.telefono,
       count(v.id)::int                                   AS ventas,
       sum(v.monto_total)                                 AS facturado,
       sum(v.abonado)                                     AS abonado,
       sum(v.saldo)                                       AS saldo,
       max(current_date - v.fecha_venta::date) FILTER (WHERE v.saldo > 0)
                                                          AS dias_del_saldo_mas_viejo
FROM v_ventas v
JOIN clientes c ON c.id = v.cliente_id
WHERE v.estado = 'vigente'
GROUP BY c.id, c.nombre, c.telefono
HAVING sum(v.saldo) > 0
ORDER BY saldo DESC;
