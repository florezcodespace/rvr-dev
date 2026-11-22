-- ============================================================================
--  Portal RvR Tecnologías · KPI BONO · Distribución por medio de pago
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:
-- El medio es ahora un catálogo (`metodos_pago`), así que agrupar es un JOIN
-- y no hay que normalizar texto. El LEFT JOIN muestra también los medios que
-- no se han usado, con cero.

SELECT
  m.nombre                                                     AS medio_de_pago,
  count(a.id)                                                  AS abonos,
  coalesce(sum(a.monto), 0)                                    AS total,
  round(100.0 * coalesce(sum(a.monto), 0)
        / NULLIF(sum(sum(a.monto)) OVER (), 0), 1)             AS porcentaje
FROM metodos_pago m
LEFT JOIN abonos a ON a.metodo_pago_id = m.id AND a.estado <> 'reembolsado'
GROUP BY m.id, m.nombre
ORDER BY total DESC, m.nombre;
