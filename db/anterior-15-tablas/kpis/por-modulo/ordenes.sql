-- ============================================================================
--  Módulo Órdenes de servicio · /ordenes
--
--  Las consultas que sostienen el encabezado, el listado y los filtros, tal
--  como las ejecuta `api/src/modulos/ordenes.ts`. Todas son SELECT.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ENCABEZADO · "81 órdenes registradas · 56 activas"
-- ---------------------------------------------------------------------------
SELECT
  count(*)::int                                                          AS total,
  count(*) FILTER (WHERE estado NOT IN ('completada', 'cancelada'))::int AS activas
FROM ordenes_servicio;


-- ---------------------------------------------------------------------------
-- LISTADO · Una fila por orden, con su cliente, su técnico y su próxima visita
--
-- Los dos LATERAL evitan multiplicar filas: una orden con tres visitas
-- aparecería tres veces con un JOIN normal a `agendamientos`.
--   · "asignación"  = cuándo se agendó al técnico actual.
--   · "programada"  = la visita vigente más reciente.
-- ---------------------------------------------------------------------------
SELECT
  'OS-' || lpad(o.id::text, 4, '0')                  AS codigo,
  c.nombre                                            AS cliente,
  trim(u.nombres || ' ' || u.apellidos)               AS tecnico,
  o.fecha_ingreso                                     AS solicitud,
  visita.fecha_programada                             AS programada,
  o.direccion_servicio,
  left(o.descripcion_problema, 60)                    AS diagnostico_inicial,
  o.estado
FROM ordenes_servicio o
JOIN clientes c       ON c.id = o.cliente_id
LEFT JOIN tecnicos t  ON t.id = o.tecnico_id
LEFT JOIN usuarios u  ON u.id = t.usuario_id
LEFT JOIN LATERAL (
  SELECT a.fecha_programada FROM agendamientos a
   WHERE a.orden_id = o.id AND a.estado <> 'cancelado'
   ORDER BY a.fecha_programada DESC LIMIT 1
) visita ON true
ORDER BY o.fecha_ingreso DESC, o.id DESC
LIMIT 12;


-- ---------------------------------------------------------------------------
-- DETALLE DE UNA ORDEN · /ordenes/:id
--
-- Cambia el 60 por el id que quieras ver. Son cuatro consultas separadas
-- porque cada una devuelve su propia lista.
-- ---------------------------------------------------------------------------

-- 1. Servicios cobrados en la orden (precio y garantía COPIADOS al crearla)
SELECT s.nombre AS servicio, c.nombre AS categoria, d.cantidad,
       d.precio_unitario, d.dias_garantia, d.subtotal
  FROM orden_servicio_detalle d
  JOIN servicios s  ON s.id = d.servicio_id
  JOIN categorias c ON c.id = s.categoria_id
 WHERE d.orden_id = 60
 ORDER BY d.id;

-- 2. Visitas de la orden (cada reprogramación queda como una visita más)
SELECT a.fecha_programada, a.estado,
       trim(u.nombres || ' ' || u.apellidos) AS tecnico, a.notas
  FROM agendamientos a
  JOIN tecnicos t ON t.id = a.tecnico_id
  JOIN usuarios u ON u.id = t.usuario_id
 WHERE a.orden_id = 60
 ORDER BY a.fecha_programada DESC;

-- 3. Diagnósticos registrados por el técnico
SELECT g.fecha_diagnostico, trim(u.nombres || ' ' || u.apellidos) AS tecnico,
       g.hallazgos, g.solucion_propuesta
  FROM diagnosticos g
  JOIN tecnicos t ON t.id = g.tecnico_id
  JOIN usuarios u ON u.id = t.usuario_id
 WHERE g.orden_id = 60
 ORDER BY g.fecha_diagnostico DESC;

-- 4. Venta y pagos de la orden
SELECT v.monto_total, v.abonado, v.saldo, v.estado_pago, v.fecha_venta
  FROM v_ventas v WHERE v.orden_id = 60;

SELECT 'PG-' || lpad(a.id::text, 4, '0') AS recibo, a.fecha_abono, a.monto,
       m.nombre AS medio, a.tipo_pago, a.estado, a.referencia
  FROM abonos a
  JOIN ventas v       ON v.id = a.venta_id
  JOIN metodos_pago m ON m.id = a.metodo_pago_id
 WHERE v.orden_id = 60
 ORDER BY a.fecha_abono DESC;


-- ---------------------------------------------------------------------------
-- GARANTÍA DE LA ORDEN · desde la entrega y con los días copiados al detalle
-- ---------------------------------------------------------------------------
SELECT
  'OS-' || lpad(o.id::text, 4, '0')                            AS orden,
  o.fecha_entrega::date                                        AS entregada,
  max(d.dias_garantia)                                         AS dias_garantia,
  (o.fecha_entrega::date + max(d.dias_garantia))               AS vence,
  (o.fecha_entrega::date + max(d.dias_garantia)) - current_date AS dias_restantes
FROM ordenes_servicio o
JOIN orden_servicio_detalle d ON d.orden_id = o.id
WHERE o.id = 60 AND o.estado = 'completada'
GROUP BY o.id, o.fecha_entrega;


-- ---------------------------------------------------------------------------
-- FILTROS · Los catálogos que llenan los desplegables del listado
-- ---------------------------------------------------------------------------
SELECT id, nombre FROM clientes WHERE estado = 'activo' ORDER BY nombre;

SELECT t.id, trim(u.nombres || ' ' || u.apellidos) AS nombre, t.especialidad,
       t.estado
  FROM tecnicos t JOIN usuarios u ON u.id = t.usuario_id
 WHERE u.estado IN ('activo', 'invitacion_enviada')
 ORDER BY nombre;
