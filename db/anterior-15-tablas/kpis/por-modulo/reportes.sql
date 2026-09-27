-- ============================================================================
--  Módulo Reportes · /reportes
--
--  El mismo tablero, pero por período y con más detalle, tal como lo ejecuta
--  `api/src/modulos/reportes.ts`. Todas son SELECT.
--
--  EL PERÍODO ES EL 90 QUE APARECE EN CADA CONSULTA. Cámbialo por 30, 180 o
--  365 para ver los otros rangos del portal (30d, 90d, 6m, 12m). El período
--  ANTERIOR es la ventana inmediatamente anterior del mismo tamaño: comparar
--  90 días contra 30 no diría nada.
--
--  El acuerdo de servicio (SLA) del portal son 5 DÍAS entre el ingreso de la
--  orden y su entrega.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- CIFRAS DEL REPORTE · las cuatro tarjetas de arriba, de una sola consulta
--
--   completadas / creadas   → "cuántas se cerraron de las que entraron"
--   en_sla                  → de las completadas, cuántas dentro de 5 días
--   ingresos                → abonos del período (lo que entró, no lo facturado)
--   cierre                  → días promedio de ingreso a entrega
--   por_cobrar / facturado  → cartera viva y lo emitido en el período
-- ---------------------------------------------------------------------------
WITH p AS (
  SELECT current_date - 90      AS desde,
         current_date + 1       AS hasta,
         current_date - 2 * 90  AS desde_previo
)
SELECT
  (SELECT count(*) FROM ordenes_servicio o, p
    WHERE o.estado = 'completada'
      AND o.fecha_entrega >= p.desde AND o.fecha_entrega < p.hasta)::int      AS completadas,
  (SELECT count(*) FROM ordenes_servicio o, p
    WHERE o.fecha_ingreso >= p.desde AND o.fecha_ingreso < p.hasta)::int      AS creadas,
  (SELECT count(*) FROM ordenes_servicio o, p
    WHERE o.estado = 'completada'
      AND o.fecha_entrega >= p.desde AND o.fecha_entrega < p.hasta
      AND o.fecha_entrega <= o.fecha_ingreso + (5 * interval '1 day'))::int   AS en_sla,
  (SELECT coalesce(sum(a.monto), 0) FROM abonos a, p
    WHERE a.estado <> 'reembolsado'
      AND a.fecha_abono >= p.desde AND a.fecha_abono < p.hasta)               AS ingresos,
  (SELECT coalesce(sum(a.monto), 0) FROM abonos a, p
    WHERE a.estado <> 'reembolsado'
      AND a.fecha_abono >= p.desde_previo AND a.fecha_abono < p.desde)        AS ingresos_previos,
  (SELECT coalesce(round(avg(extract(epoch FROM o.fecha_entrega - o.fecha_ingreso) / 86400)::numeric, 1), 0)
     FROM ordenes_servicio o, p
    WHERE o.estado = 'completada'
      AND o.fecha_entrega >= p.desde AND o.fecha_entrega < p.hasta)           AS dias_de_cierre,
  (SELECT coalesce(round(avg(extract(epoch FROM o.fecha_entrega - o.fecha_ingreso) / 86400)::numeric, 1), 0)
     FROM ordenes_servicio o, p
    WHERE o.estado = 'completada'
      AND o.fecha_entrega >= p.desde_previo AND o.fecha_entrega < p.desde)    AS dias_de_cierre_previo,
  (SELECT count(*) FROM ordenes_servicio o, p
    WHERE o.estado = 'completada'
      AND o.fecha_entrega >= p.desde_previo AND o.fecha_entrega < p.desde)::int
                                                                              AS completadas_previas,
  (SELECT coalesce(sum(v.saldo), 0) FROM v_ventas v WHERE v.estado = 'vigente') AS por_cobrar,
  (SELECT coalesce(sum(v.monto_total), 0) FROM v_ventas v, p
    WHERE v.estado = 'vigente'
      AND v.fecha_venta >= p.desde AND v.fecha_venta < p.hasta)               AS facturado;


-- ---------------------------------------------------------------------------
-- LAS MISMAS CIFRAS, YA CONVERTIDAS EN LOS PORCENTAJES QUE MUESTRA EL PORTAL
--
-- Es la consulta de arriba con la aritmética que la API hace en JavaScript.
-- Cuando no hay período anterior la variación sale NULL: mejor vacío que un
-- "+100 %" falso.
-- ---------------------------------------------------------------------------
WITH p AS (
  SELECT current_date - 90 AS desde, current_date + 1 AS hasta,
         current_date - 2 * 90 AS desde_previo
), c AS (
  SELECT
    (SELECT count(*) FROM ordenes_servicio o, p
      WHERE o.estado = 'completada'
        AND o.fecha_entrega >= p.desde AND o.fecha_entrega < p.hasta)         AS completadas,
    (SELECT count(*) FROM ordenes_servicio o, p
      WHERE o.estado = 'completada'
        AND o.fecha_entrega >= p.desde AND o.fecha_entrega < p.hasta
        AND o.fecha_entrega <= o.fecha_ingreso + (5 * interval '1 day'))      AS en_sla,
    (SELECT coalesce(sum(a.monto), 0) FROM abonos a, p
      WHERE a.estado <> 'reembolsado'
        AND a.fecha_abono >= p.desde AND a.fecha_abono < p.hasta)             AS ingresos,
    (SELECT coalesce(sum(a.monto), 0) FROM abonos a, p
      WHERE a.estado <> 'reembolsado'
        AND a.fecha_abono >= p.desde_previo AND a.fecha_abono < p.desde)      AS previos
)
SELECT completadas,
       round(100.0 * en_sla / NULLIF(completadas, 0))::int  AS cumplimiento_sla_pct,
       ingresos,
       round(100.0 * (ingresos - previos) / NULLIF(previos, 0))::int
                                                            AS variacion_ingresos_pct
FROM c;


-- ---------------------------------------------------------------------------
-- GRÁFICA 1 · Creadas contra completadas, en 11 tramos
--
-- El rango se parte siempre en 11 tramos iguales, sea de 30 días o de un año:
-- así la gráfica tiene la misma densidad de puntos en todos los períodos.
-- ---------------------------------------------------------------------------
WITH tramos AS (
  SELECT generate_series(
           current_date - 90,
           current_date,
           make_interval(days => greatest((90 / 11)::int, 1))
         )::date AS inicio
), rango AS (
  SELECT inicio,
         lead(inicio, 1, current_date + 1) OVER (ORDER BY inicio) AS fin
    FROM tramos
)
SELECT to_char(r.inicio, 'DD Mon') AS tramo, r.inicio, r.fin,
       (SELECT count(*) FROM ordenes_servicio o
         WHERE o.fecha_ingreso >= r.inicio AND o.fecha_ingreso < r.fin)::int AS creadas,
       (SELECT count(*) FROM ordenes_servicio o
         WHERE o.estado = 'completada'
           AND o.fecha_entrega >= r.inicio AND o.fecha_entrega < r.fin)::int AS completadas
  FROM rango r
 ORDER BY r.inicio;


-- ---------------------------------------------------------------------------
-- GRÁFICA 2 · Pipeline del período: órdenes por estado
--
-- `enum_range` recorre los ocho estados declarados en la base; el portal
-- después esconde los que quedan en cero.
-- ---------------------------------------------------------------------------
SELECT e.estado::text AS estado, count(o.id)::int AS cantidad
  FROM unnest(enum_range(NULL::estado_orden)) AS e (estado)
  LEFT JOIN ordenes_servicio o
         ON o.estado = e.estado AND o.fecha_ingreso >= current_date - 90
 GROUP BY e.estado
 ORDER BY e.estado;


-- ---------------------------------------------------------------------------
-- TABLA 1 · Servicios más pedidos del período
-- ---------------------------------------------------------------------------
SELECT s.nombre AS servicio, count(DISTINCT d.orden_id)::int AS ordenes
  FROM orden_servicio_detalle d
  JOIN ordenes_servicio o ON o.id = d.orden_id AND o.estado <> 'cancelada'
  JOIN servicios s        ON s.id = d.servicio_id
 WHERE o.fecha_ingreso >= current_date - 90
 GROUP BY s.id, s.nombre
 ORDER BY ordenes DESC, s.nombre
 LIMIT 6;


-- ---------------------------------------------------------------------------
-- TABLA 2 · Técnicos con más órdenes cerradas del período
-- ---------------------------------------------------------------------------
SELECT trim(u.nombres || ' ' || u.apellidos) AS tecnico,
       count(o.id) FILTER (WHERE o.estado = 'completada')::int AS cerradas
  FROM tecnicos t
  JOIN usuarios u ON u.id = t.usuario_id
  LEFT JOIN ordenes_servicio o
         ON o.tecnico_id = t.id AND o.fecha_entrega >= current_date - 90
 GROUP BY t.id, u.nombres, u.apellidos
 ORDER BY cerradas DESC, tecnico
 LIMIT 6;
