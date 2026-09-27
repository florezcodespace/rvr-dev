-- ============================================================================
--  Módulo Pagos · /pagos
--
--  Las cuatro tarjetas, las dos gráficas, el listado y la ficha, tal como los
--  ejecuta `api/src/modulos/ventas.ts`. Todas son SELECT.
--
--  Idea clave: un pago del portal es un `abono` a la VENTA de una orden. La
--  vista `v_ventas` calcula por venta el abonado, el saldo y el estado de pago,
--  así que Pagos, Clientes y el Tablero siempre dan la misma cifra.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- TARJETAS 1 a 4 · recaudado del mes · por conciliar · vencidos · días de cobro
--
-- "Vencidos" es 0 a propósito: el modelo no guarda fecha de vencimiento de un
-- abono, así que la tarjeta no inventa un dato que la base no tiene.
-- ---------------------------------------------------------------------------
SELECT
  count(*)::int                                                         AS pagos_registrados,
  count(*) FILTER (WHERE estado = 'por_conciliar')::int                 AS por_conciliar,
  coalesce(sum(monto) FILTER (WHERE estado = 'por_conciliar'), 0)       AS valor_por_conciliar,
  count(*) FILTER (WHERE estado = 'conciliado')::int                    AS conciliados,
  coalesce(sum(monto) FILTER (WHERE estado <> 'reembolsado'
                AND fecha_abono >= date_trunc('month', now())), 0)      AS recaudado_del_mes,
  -- La meta del mes es lo facturado en el mes: lo que debería entrar.
  (SELECT coalesce(sum(monto_total), 0) FROM ventas
    WHERE estado = 'vigente'
      AND fecha_venta >= date_trunc('month', now()))                    AS meta_del_mes,
  -- Días entre la venta y el abono que la dejó saldada.
  (SELECT coalesce(round(avg(extract(epoch FROM x.ultimo - x.fecha_venta) / 86400)), 0)
     FROM (SELECT v.fecha_venta, max(ab.fecha_abono) AS ultimo
             FROM v_ventas v JOIN abonos ab ON ab.venta_id = v.id
            WHERE v.estado_pago = 'pagado'
            GROUP BY v.id, v.fecha_venta) x)::int                       AS dias_de_cobro
FROM abonos;


-- ---------------------------------------------------------------------------
-- GRÁFICA 1 · Recaudo de los últimos 6 meses
--
-- La serie de meses va primero: un mes sin pagos debe aparecer en cero, no
-- desaparecer de la gráfica.
-- ---------------------------------------------------------------------------
SELECT to_char(m.mes, 'YYYY-MM') AS mes, coalesce(sum(a.monto), 0) AS recaudado
  FROM generate_series(date_trunc('month', now()) - interval '5 months',
                       date_trunc('month', now()), interval '1 month') AS m (mes)
  LEFT JOIN abonos a
         ON date_trunc('month', a.fecha_abono) = m.mes AND a.estado <> 'reembolsado'
 GROUP BY m.mes
 ORDER BY m.mes;


-- ---------------------------------------------------------------------------
-- GRÁFICA 2 · Medios de pago (el porcentaje sale de estos totales)
-- ---------------------------------------------------------------------------
SELECT m.nombre AS medio, coalesce(sum(a.monto), 0) AS total,
       round(100.0 * coalesce(sum(a.monto), 0)
             / NULLIF((SELECT sum(monto) FROM abonos WHERE estado <> 'reembolsado'), 0))::int
         AS porcentaje
  FROM metodos_pago m
  LEFT JOIN abonos a ON a.metodo_pago_id = m.id AND a.estado <> 'reembolsado'
 GROUP BY m.id, m.nombre
HAVING coalesce(sum(a.monto), 0) > 0
 ORDER BY total DESC;


-- ---------------------------------------------------------------------------
-- LISTADO · Lo que se ve en la tabla de pagos
-- ---------------------------------------------------------------------------
SELECT 'PG-' || lpad(a.id::text, 4, '0')        AS recibo,
       c.nombre                                  AS cliente,
       'OS-' || lpad(v.orden_id::text, 4, '0')   AS orden,
       a.monto                                   AS valor,
       m.nombre                                  AS medio,
       a.tipo_pago::text                         AS tipo,
       a.estado::text                            AS estado,
       a.referencia,
       to_char(a.fecha_abono, 'YYYY-MM-DD')      AS fecha
  FROM abonos a
  JOIN ventas v           ON v.id = a.venta_id
  JOIN ordenes_servicio o ON o.id = v.orden_id
  JOIN clientes c         ON c.id = o.cliente_id
  JOIN metodos_pago m     ON m.id = a.metodo_pago_id
 ORDER BY a.fecha_abono DESC, a.id DESC
 LIMIT 12;


-- ---------------------------------------------------------------------------
-- PESTAÑAS · Todos / Por conciliar / Conciliados / Vencidos
-- ---------------------------------------------------------------------------
SELECT a.estado::text AS estado, count(*)::int AS pagos, sum(a.monto) AS valor
  FROM abonos a
 GROUP BY a.estado
 ORDER BY pagos DESC;


-- ---------------------------------------------------------------------------
-- FICHA DEL PAGO · /pagos/:id  (cambia el 1 por el id que quieras)
-- ---------------------------------------------------------------------------

-- La venta a la que pertenece: total, abonado y saldo
SELECT v.id AS venta, v.monto_total, v.abonado, v.saldo, v.estado_pago, v.fecha_venta
  FROM v_ventas v JOIN abonos a ON a.venta_id = v.id
 WHERE a.id = 1;

-- Los demás pagos de la misma venta
SELECT 'PG-' || lpad(a.id::text, 4, '0') AS recibo, a.fecha_abono, a.monto,
       m.nombre AS medio, a.tipo_pago::text AS tipo, a.estado::text AS estado
  FROM abonos a
  JOIN metodos_pago m ON m.id = a.metodo_pago_id
 WHERE a.venta_id = (SELECT venta_id FROM abonos WHERE id = 1)
 ORDER BY a.fecha_abono;


-- ---------------------------------------------------------------------------
-- EXTRA · Estado de pago de cada venta (lo que calcula la vista)
-- ---------------------------------------------------------------------------
SELECT v.estado_pago, count(*)::int AS ventas,
       sum(v.monto_total) AS facturado, sum(v.abonado) AS abonado, sum(v.saldo) AS saldo
  FROM v_ventas v
 WHERE v.estado = 'vigente'
 GROUP BY v.estado_pago
 ORDER BY ventas DESC;
