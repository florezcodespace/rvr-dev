-- ============================================================================
--  Módulo Servicios (catálogo) · /servicios
--
--  Las cuatro tarjetas, el listado y la ficha, tal como las ejecuta
--  `api/src/modulos/catalogo.ts`. Todas son SELECT.
--
--  Idea clave: el catálogo dice cuánto VALE hoy un servicio; lo que se COBRÓ
--  está copiado en `orden_servicio_detalle` (precio_unitario y dias_garantia).
--  Por eso los ingresos se suman del detalle, nunca de `servicios.precio`.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- BASE · El servicio con su categoría y en cuántas órdenes ha ido
-- ---------------------------------------------------------------------------
SELECT s.id, s.nombre, coalesce(s.descripcion, '') AS descripcion,
       c.nombre                                    AS categoria,
       s.precio, s.dias_garantia, s.estado::text   AS estado,
       (SELECT count(DISTINCT d.orden_id) FROM orden_servicio_detalle d
         WHERE d.servicio_id = s.id)::int          AS ordenes
  FROM servicios s
  JOIN categorias c ON c.id = s.categoria_id
 ORDER BY ordenes DESC, s.nombre;


-- ---------------------------------------------------------------------------
-- TARJETA 1 y 2 · Publicados / borradores y el servicio más solicitado
-- ---------------------------------------------------------------------------
SELECT
  count(*) FILTER (WHERE estado = 'activo')::int     AS publicados,
  count(*) FILTER (WHERE estado = 'borrador')::int   AS borradores,
  count(*) FILTER (WHERE estado = 'archivado')::int  AS archivados,
  count(*)::int                                      AS total
FROM servicios;

-- El más solicitado (el que encabeza la tarjeta)
SELECT s.nombre, c.nombre AS categoria, s.precio,
       count(DISTINCT d.orden_id)::int AS ordenes
  FROM servicios s
  JOIN categorias c              ON c.id = s.categoria_id
  LEFT JOIN orden_servicio_detalle d ON d.servicio_id = s.id
 GROUP BY s.id, s.nombre, c.nombre, s.precio
 ORDER BY ordenes DESC, s.nombre
 LIMIT 5;


-- ---------------------------------------------------------------------------
-- TARJETA 3 · Ingreso del mes por servicios entregados
--
-- Se suma el `subtotal` del detalle (precio copiado al crear la orden) de las
-- órdenes COMPLETADAS este mes: es lo que realmente se cobró.
-- ---------------------------------------------------------------------------
SELECT coalesce(sum(d.subtotal), 0) AS ingreso_del_mes
  FROM orden_servicio_detalle d
  JOIN ordenes_servicio o ON o.id = d.orden_id
 WHERE o.estado = 'completada'
   AND o.fecha_entrega >= date_trunc('month', now());


-- ---------------------------------------------------------------------------
-- TARJETA 4 · Duración promedio de un servicio (días de ingreso a entrega)
-- ---------------------------------------------------------------------------
SELECT round(avg(extract(epoch FROM fecha_entrega - fecha_ingreso) / 86400)::numeric, 1)
         AS dias_promedio
  FROM ordenes_servicio
 WHERE estado = 'completada';


-- ---------------------------------------------------------------------------
-- PESTAÑAS · Todos / Soporte / Infraestructura / Seguridad / Borradores
-- ---------------------------------------------------------------------------
SELECT c.nombre AS categoria,
       count(*)::int                                     AS servicios,
       count(*) FILTER (WHERE s.estado = 'borrador')::int AS en_borrador
  FROM servicios s
  JOIN categorias c ON c.id = s.categoria_id
 GROUP BY c.nombre
 ORDER BY servicios DESC;


-- ---------------------------------------------------------------------------
-- FICHA DEL SERVICIO · /servicios/:id  (cambia el 1 por el id que quieras)
-- ---------------------------------------------------------------------------

-- Resumen: unidades vendidas, órdenes, completadas y facturado
SELECT
  coalesce(sum(d.cantidad), 0)::int                                       AS unidades,
  count(DISTINCT d.orden_id)::int                                         AS ordenes,
  count(DISTINCT d.orden_id) FILTER (WHERE o.estado = 'completada')::int  AS completadas,
  coalesce(sum(d.subtotal) FILTER (WHERE o.estado = 'completada'), 0)     AS facturado
FROM orden_servicio_detalle d
JOIN ordenes_servicio o ON o.id = d.orden_id
WHERE d.servicio_id = 1;

-- En qué órdenes ha ido
SELECT 'OS-' || lpad(o.id::text, 4, '0') AS orden, o.estado, o.fecha_ingreso,
       c.nombre AS cliente, d.cantidad, d.precio_unitario, d.subtotal
  FROM orden_servicio_detalle d
  JOIN ordenes_servicio o ON o.id = d.orden_id
  JOIN clientes c         ON c.id = o.cliente_id
 WHERE d.servicio_id = 1
 ORDER BY o.fecha_ingreso DESC
 LIMIT 15;


-- ---------------------------------------------------------------------------
-- EXTRA · Qué deja cada servicio: demanda contra dinero
--
-- El más pedido no siempre es el que más deja. Esta consulta pone las dos
-- columnas al lado.
-- ---------------------------------------------------------------------------
SELECT s.nombre AS servicio, c.nombre AS categoria,
       count(DISTINCT d.orden_id)::int                                    AS ordenes,
       coalesce(sum(d.cantidad), 0)::int                                  AS unidades,
       coalesce(sum(d.subtotal), 0)                                       AS facturado,
       round(coalesce(avg(d.precio_unitario), s.precio))                  AS precio_promedio_cobrado,
       s.precio                                                           AS precio_de_lista
  FROM servicios s
  JOIN categorias c                  ON c.id = s.categoria_id
  LEFT JOIN orden_servicio_detalle d ON d.servicio_id = s.id
  LEFT JOIN ordenes_servicio o       ON o.id = d.orden_id AND o.estado <> 'cancelada'
 GROUP BY s.id, s.nombre, c.nombre, s.precio
 ORDER BY facturado DESC;
