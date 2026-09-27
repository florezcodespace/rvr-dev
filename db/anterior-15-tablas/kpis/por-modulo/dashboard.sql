-- ============================================================================
--  Tablero (Dashboard) · /panel
--
--  Una consulta por tarjeta y por gráfica, tal como las ejecuta la API en
--  `api/src/modulos/dashboard.ts`. Todas son SELECT: no cambian nada.
--
--  En pgAdmin: Query Tool sobre la base `rvr`, selecciona un bloque y F5.
--  El período es de 30 días; para cambiarlo, reemplaza el 30 de cada consulta.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- TARJETA 1 · Ingresos del período (y su comparación con los 30 días previos)
--
-- El ingreso es lo ABONADO, no lo facturado: una venta emitida y sin cobrar
-- todavía no es plata que entró. Los abonos reembolsados no cuentan.
-- ---------------------------------------------------------------------------
SELECT
  coalesce(sum(monto) FILTER (WHERE fecha_abono >= current_date - 30), 0)   AS ingresos_periodo,
  coalesce(sum(monto) FILTER (WHERE fecha_abono >= current_date - 60
                                AND fecha_abono <  current_date - 30), 0)   AS ingresos_previos,
  round(
    100.0 * (coalesce(sum(monto) FILTER (WHERE fecha_abono >= current_date - 30), 0)
             - coalesce(sum(monto) FILTER (WHERE fecha_abono >= current_date - 60
                                             AND fecha_abono < current_date - 30), 0))
    / NULLIF(coalesce(sum(monto) FILTER (WHERE fecha_abono >= current_date - 60
                                           AND fecha_abono < current_date - 30), 0), 0), 1)
                                                                            AS variacion_pct
FROM abonos
WHERE estado <> 'reembolsado';


-- ---------------------------------------------------------------------------
-- TARJETA 2 · Órdenes completadas del período  ("12 / 40")
-- ---------------------------------------------------------------------------
SELECT
  count(*) FILTER (WHERE estado = 'completada')::int                 AS completadas,
  count(*)::int                                                      AS del_periodo,
  round(100.0 * count(*) FILTER (WHERE estado = 'completada')
        / NULLIF(count(*), 0), 1)                                    AS porcentaje
FROM ordenes_servicio
WHERE fecha_ingreso >= current_date - 30;


-- ---------------------------------------------------------------------------
-- TARJETA 3 · Órdenes activas y cuántas van sin técnico
--
-- "Activa" = ni completada ni cancelada. Sin período: lo que está abierto hoy
-- importa aunque haya entrado hace tres meses.
-- ---------------------------------------------------------------------------
SELECT
  count(*)::int                                                      AS activas,
  count(*) FILTER (WHERE tecnico_id IS NULL)::int                    AS sin_tecnico
FROM ordenes_servicio
WHERE estado NOT IN ('completada', 'cancelada');


-- ---------------------------------------------------------------------------
-- TARJETA 4 · Cartera recaudada (porcentaje y saldo por cobrar)
--
-- Sale de la vista `v_ventas`, que calcula abonado y saldo de cada venta.
-- ---------------------------------------------------------------------------
SELECT
  coalesce(sum(monto_total), 0)                                      AS facturado,
  coalesce(sum(abonado), 0)                                          AS recaudado,
  coalesce(sum(saldo), 0)                                            AS por_cobrar,
  round(100.0 * sum(abonado) / NULLIF(sum(monto_total), 0))::int     AS porcentaje_recaudado,
  count(*) FILTER (WHERE saldo = 0)::int                             AS ventas_al_dia,
  count(*) FILTER (WHERE saldo > 0)::int                             AS ventas_con_saldo
FROM v_ventas
WHERE estado = 'vigente';


-- ---------------------------------------------------------------------------
-- ENCABEZADO · "Hoy hay N servicios agendados y M órdenes esperando aprobación"
-- ---------------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM agendamientos
    WHERE estado <> 'cancelado' AND fecha_programada::date = current_date)::int AS visitas_hoy,
  (SELECT count(*) FROM ordenes_servicio WHERE estado = 'pendiente')::int       AS por_aprobar,
  (SELECT count(*) FROM ordenes_servicio)::int                                  AS total_ordenes,
  (SELECT count(*) FROM ordenes_servicio
    WHERE estado = 'pendiente'
      AND fecha_ingreso < now() - interval '3 days')::int                        AS estancadas;


-- ---------------------------------------------------------------------------
-- GRÁFICA 1 · Tendencia de 14 días: creadas contra completadas
--
-- `generate_series` primero y los conteos después: sin la serie, un día sin
-- órdenes no aparece, el eje se comprime y la línea miente sobre la pendiente.
-- ---------------------------------------------------------------------------
SELECT
  d.dia,
  (SELECT count(*) FROM ordenes_servicio o
    WHERE o.fecha_ingreso::date = d.dia)::int                        AS creadas,
  (SELECT count(*) FROM ordenes_servicio o
    WHERE o.estado = 'completada' AND o.fecha_entrega::date = d.dia)::int AS completadas
FROM generate_series(current_date - 13, current_date, interval '1 day') AS d (dia)
ORDER BY d.dia;


-- ---------------------------------------------------------------------------
-- GRÁFICA 2 · Pipeline: cuántas órdenes hay en cada estado
--
-- `enum_range` recorre los ocho estados declarados en la base, así los que
-- están en cero también salen (y en el orden del flujo, no del alfabeto).
-- ---------------------------------------------------------------------------
SELECT e.estado::text AS estado, count(o.id)::int AS cantidad
FROM unnest(enum_range(NULL::estado_orden)) AS e (estado)
LEFT JOIN ordenes_servicio o ON o.estado = e.estado
GROUP BY e.estado
ORDER BY e.estado;


-- ---------------------------------------------------------------------------
-- GRÁFICA 3 · Agenda de visitas de los próximos 7 días
-- ---------------------------------------------------------------------------
SELECT d.dia, count(a.id)::int AS visitas
FROM generate_series(current_date, current_date + 6, interval '1 day') AS d (dia)
LEFT JOIN agendamientos a
       ON a.fecha_programada::date = d.dia AND a.estado <> 'cancelado'
GROUP BY d.dia
ORDER BY d.dia;


-- ---------------------------------------------------------------------------
-- LISTA · Actividad reciente (últimos movimientos del portal)
--
-- Cuatro consultas unidas: órdenes creadas, órdenes completadas, visitas
-- agendadas y pagos registrados. Se ordenan por fecha y se toman las seis
-- últimas.
-- ---------------------------------------------------------------------------
(SELECT 'orden' AS tipo, o.id AS ref, 'Orden creada · ' || c.nombre AS titulo,
        left(o.descripcion_problema, 80) AS detalle, o.fecha_ingreso AS fecha
   FROM ordenes_servicio o JOIN clientes c ON c.id = o.cliente_id
  ORDER BY o.fecha_ingreso DESC LIMIT 5)
UNION ALL
(SELECT 'orden', o.id, 'Marcada como COMPLETADA', c.nombre, o.fecha_entrega
   FROM ordenes_servicio o JOIN clientes c ON c.id = o.cliente_id
  WHERE o.estado = 'completada'
  ORDER BY o.fecha_entrega DESC LIMIT 5)
UNION ALL
(SELECT 'agendamiento', a.orden_id, 'Visita agendada',
        trim(u.nombres || ' ' || u.apellidos) || ' · '
          || to_char(a.fecha_programada, 'DD/MM HH24:MI'),
        a.fecha_creacion
   FROM agendamientos a
   JOIN tecnicos t ON t.id = a.tecnico_id
   JOIN usuarios u ON u.id = t.usuario_id
  ORDER BY a.fecha_creacion DESC LIMIT 5)
UNION ALL
(SELECT 'pago', v.orden_id,
        CASE ab.tipo_pago WHEN 'anticipo' THEN 'Anticipo registrado'
                          ELSE 'Pago de saldo registrado' END,
        c.nombre || ' · ' || m.nombre || ' · $' || to_char(ab.monto, 'FM999G999G999'),
        ab.fecha_abono
   FROM abonos ab
   JOIN ventas v           ON v.id = ab.venta_id
   JOIN ordenes_servicio o ON o.id = v.orden_id
   JOIN clientes c         ON c.id = o.cliente_id
   JOIN metodos_pago m     ON m.id = ab.metodo_pago_id
  ORDER BY ab.fecha_abono DESC LIMIT 5)
ORDER BY fecha DESC
LIMIT 6;
