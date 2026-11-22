-- ============================================================================
--  Portal RvR Tecnologías · KPI B8 · Agenda de visitas de los próximos 7 días
--  Cómo correrla: pgAdmin → base rvr → Query Tool → abrir este archivo → F5.
--  Solo lee (SELECT): no cambia nada en la base.
-- ============================================================================

-- Qué mide:

WITH dias AS (
  SELECT generate_series(current_date, current_date + interval '6 days',
                         interval '1 day')::date AS dia
)
SELECT
  d.dia,
  -- Mismo motivo: el nombre del día se arma con el número de día de la semana.
  (ARRAY['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'])[extract(dow FROM d.dia)::int + 1]
                                                                      AS etiqueta,
  CASE WHEN d.dia = current_date THEN 'HOY' ELSE '' END                AS marca,
  count(a.id)                                                         AS visitas,
  count(DISTINCT a.tecnico_id)                                        AS tecnicos
FROM dias d
LEFT JOIN agendamientos a
       ON a.fecha_programada::date = d.dia
      AND a.estado <> 'cancelado'
GROUP BY d.dia
ORDER BY d.dia;
