-- ============================================================================
--  Portal RvR Tecnologías · KPI B1 · Ingresos del período, contra los 30 días anteriores
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- El ingreso es lo **abonado**, no lo facturado: una venta emitida y sin cobrar
-- no es plata que entró. Los abonos reembolsados no cuentan. La variación compara con la ventana inmediatamente
-- anterior de la misma duración.

WITH periodo AS (
  SELECT current_date - interval '30 days' AS desde,
         current_date + interval '1 day'   AS hasta
),
ventanas AS (
  SELECT
    coalesce(sum(a.monto) FILTER (
      WHERE a.fecha_abono >= p.desde AND a.fecha_abono < p.hasta), 0)  AS actual,
    coalesce(sum(a.monto) FILTER (
      WHERE a.fecha_abono >= p.desde - (p.hasta - p.desde)
        AND a.fecha_abono <  p.desde), 0)                              AS anterior
  FROM abonos a, periodo p
  WHERE a.estado <> 'reembolsado'
)
SELECT
  actual                                                       AS ingresos_periodo,
  anterior                                                     AS ingresos_periodo_previo,
  actual - anterior                                            AS diferencia,
  CASE WHEN anterior = 0 THEN NULL
       ELSE round(100.0 * (actual - anterior) / anterior, 1) END AS variacion_pct
FROM ventanas;
