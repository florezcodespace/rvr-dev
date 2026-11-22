-- ============================================================================
--  Portal RvR Tecnologías · KPI B5 · Tendencia de 14 días: creadas contra completadas
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- `generate_series` primero y los conteos después. Sin la serie, un día sin
-- órdenes simplemente no aparece: el eje se comprime y la línea miente sobre
-- la pendiente.

WITH dias AS (
  SELECT generate_series(current_date - interval '13 days',
                         current_date,
                         interval '1 day')::date AS dia
)
SELECT
  d.dia,
  -- Etiqueta en español sin depender de `lc_time`: el idioma del servidor no
  -- es el mismo en Neon, en Windows y en el equipo de cada quien, y `to_char`
  -- con 'TM' devolvería "Sep"/"Dec" según dónde corra.
  to_char(d.dia, 'DD') || ' ' || (ARRAY['ene','feb','mar','abr','may','jun',
    'jul','ago','sep','oct','nov','dic'])[extract(month FROM d.dia)::int]
                                                                      AS etiqueta,
  count(*) FILTER (WHERE o.fecha_ingreso::date = d.dia)               AS creadas,
  count(*) FILTER (WHERE o.fecha_entrega::date = d.dia
                     AND o.estado = 'completada')                     AS completadas
FROM dias d
LEFT JOIN ordenes_servicio o
       ON o.fecha_ingreso::date = d.dia
       OR (o.fecha_entrega::date = d.dia AND o.estado = 'completada')
GROUP BY d.dia
ORDER BY d.dia;
