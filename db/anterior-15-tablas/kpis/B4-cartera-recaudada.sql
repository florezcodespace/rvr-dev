-- ============================================================================
--  Portal RvR Tecnologías · KPI B4 · Cartera recaudada
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- Sale de la vista `v_ventas`, que ya trae el abonado y el saldo de cada venta.
-- Por dentro usa `LEFT JOIN LATERAL` para sumar los abonos sin multiplicar las
-- filas: con un JOIN normal a `abonos`, una venta con tres abonos contaría su
-- `monto_total` tres veces y el facturado saldría inflado.
-- Las ventas anuladas no son cartera.

SELECT
  coalesce(sum(v.monto_total), 0)                              AS facturado,
  coalesce(sum(v.abonado), 0)                                  AS recaudado,
  coalesce(sum(v.saldo), 0)                                    AS por_cobrar,
  round(100.0 * sum(v.abonado) / NULLIF(sum(v.monto_total), 0), 1)
                                                               AS porcentaje_recaudado,
  count(*)                                                     AS ventas,
  count(*) FILTER (WHERE v.saldo > 0)                          AS ventas_con_saldo
FROM v_ventas v
WHERE v.estado = 'vigente';
