-- ============================================================================
--  Módulo Técnicos · /tecnicos
--
--  Las tarjetas, el listado y la ficha, tal como las ejecuta
--  `api/src/modulos/tecnicos.ts`. Todas son SELECT.
--
--  Idea clave: el técnico vive en dos tablas. `tecnicos` guarda especialidad,
--  zona y estado del turno; el nombre, el correo y el teléfono están en su
--  cuenta de `usuarios`. Por eso todas las consultas hacen el JOIN.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- BASE · El técnico con su carga del día y su cumplimiento
--
-- `ordenes_hoy` cuenta VISITAS agendadas para hoy (no órdenes): un técnico
-- puede tener tres visitas de la misma orden en días distintos.
-- `cumplimiento` = completadas sobre las que no se cancelaron; sin órdenes
-- todavía no hay nada que incumplir, así que se muestra 100.
-- ---------------------------------------------------------------------------
SELECT t.id,
       trim(u.nombres || ' ' || u.apellidos)       AS nombre,
       t.especialidad,
       t.estado::text                              AS estado,
       coalesce(t.zona, '')                        AS zona,
       coalesce(u.telefono, '')                    AS telefono,
       (SELECT count(*) FROM agendamientos a
         WHERE a.tecnico_id = t.id
           AND a.estado <> 'cancelado'
           AND a.fecha_programada::date = current_date)::int AS ordenes_hoy,
       coalesce(round(100.0
         * count(o.id) FILTER (WHERE o.estado = 'completada')
         / NULLIF(count(o.id) FILTER (WHERE o.estado <> 'cancelada'), 0)), 100)::int
                                                   AS cumplimiento
  FROM tecnicos t
  JOIN usuarios u ON u.id = t.usuario_id
  LEFT JOIN ordenes_servicio o ON o.tecnico_id = t.id
 GROUP BY t.id, u.nombres, u.apellidos, u.telefono
 ORDER BY array_position(ARRAY['en_sitio','en_ruta','disponible','fuera_turno'],
                         t.estado::text),
          nombre;


-- ---------------------------------------------------------------------------
-- TARJETAS 1 a 4 · disponibles · en ruta o en sitio · carga de hoy · SLA
--
-- Las mismas cifras que muestra el encabezado del módulo, resumidas de una vez.
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT t.id, t.estado::text AS estado,
         (SELECT count(*) FROM agendamientos a
           WHERE a.tecnico_id = t.id
             AND a.estado <> 'cancelado'
             AND a.fecha_programada::date = current_date)::int AS ordenes_hoy,
         coalesce(round(100.0
           * count(o.id) FILTER (WHERE o.estado = 'completada')
           / NULLIF(count(o.id) FILTER (WHERE o.estado <> 'cancelada'), 0)), 100)::int
                                                               AS cumplimiento
    FROM tecnicos t
    LEFT JOIN ordenes_servicio o ON o.tecnico_id = t.id
   GROUP BY t.id, t.estado
)
SELECT
  count(*) FILTER (WHERE estado = 'disponible')::int              AS disponibles_ahora,
  count(*)::int                                                   AS tecnicos_registrados,
  count(*) FILTER (WHERE estado IN ('en_ruta', 'en_sitio'))::int  AS en_ruta_o_en_sitio,
  count(*) FILTER (WHERE estado = 'fuera_turno')::int             AS fuera_de_turno,
  sum(ordenes_hoy)::int                                           AS visitas_de_hoy,
  round(sum(ordenes_hoy)::numeric
        / NULLIF(count(*) FILTER (WHERE estado <> 'fuera_turno'), 0), 1)
                                                                  AS promedio_por_tecnico,
  round(avg(cumplimiento))::int                                   AS cumplimiento_sla
FROM base;


-- ---------------------------------------------------------------------------
-- PESTAÑAS · Todos / Disponibles / En ruta / Fuera de turno
-- ---------------------------------------------------------------------------
SELECT t.estado::text AS estado, count(*)::int AS tecnicos
  FROM tecnicos t
 GROUP BY t.estado
 ORDER BY array_position(ARRAY['disponible','en_ruta','en_sitio','fuera_turno'],
                         t.estado::text);


-- ---------------------------------------------------------------------------
-- FICHA DEL TÉCNICO · /tecnicos/:id  (cambia el 1 por el id que quieras)
-- ---------------------------------------------------------------------------

-- Resumen: asignadas, completadas, en curso y visitas de la semana
SELECT
  (SELECT count(*) FROM ordenes_servicio WHERE tecnico_id = 1)::int              AS asignadas,
  (SELECT count(*) FROM ordenes_servicio
    WHERE tecnico_id = 1 AND estado = 'completada')::int                         AS completadas,
  (SELECT count(*) FROM ordenes_servicio
    WHERE tecnico_id = 1 AND estado NOT IN ('completada', 'cancelada'))::int     AS en_curso,
  (SELECT count(*) FROM agendamientos
    WHERE tecnico_id = 1 AND estado <> 'cancelado'
      AND fecha_programada >= current_date
      AND fecha_programada < current_date + 7)::int                              AS visitas_semana;

-- Su agenda (desde ayer, para ver lo que quedó pendiente)
SELECT a.fecha_programada, a.estado::text AS estado,
       'OS-' || lpad(a.orden_id::text, 4, '0') AS orden,
       c.nombre AS cliente, o.direccion_servicio AS direccion
  FROM agendamientos a
  JOIN ordenes_servicio o ON o.id = a.orden_id
  JOIN clientes c         ON c.id = o.cliente_id
 WHERE a.tecnico_id = 1 AND a.estado <> 'cancelado'
   AND a.fecha_programada >= current_date - 1
 ORDER BY a.fecha_programada
 LIMIT 15;

-- Sus últimas órdenes
SELECT 'OS-' || lpad(o.id::text, 4, '0') AS orden, o.estado, o.fecha_ingreso,
       c.nombre AS cliente, left(o.descripcion_problema, 60) AS problema
  FROM ordenes_servicio o
  JOIN clientes c ON c.id = o.cliente_id
 WHERE o.tecnico_id = 1
 ORDER BY o.fecha_ingreso DESC
 LIMIT 15;


-- ---------------------------------------------------------------------------
-- EXTRA · Ranking: quién cerró más servicios y en cuántos días promedio
-- ---------------------------------------------------------------------------
SELECT trim(u.nombres || ' ' || u.apellidos)                    AS tecnico,
       t.especialidad,
       count(o.id)::int                                          AS asignadas,
       count(o.id) FILTER (WHERE o.estado = 'completada')::int   AS completadas,
       round(avg(extract(epoch FROM o.fecha_entrega - o.fecha_ingreso) / 86400)
             FILTER (WHERE o.estado = 'completada')::numeric, 1) AS dias_promedio
  FROM tecnicos t
  JOIN usuarios u ON u.id = t.usuario_id
  LEFT JOIN ordenes_servicio o ON o.tecnico_id = t.id
 GROUP BY t.id, u.nombres, u.apellidos, t.especialidad
 ORDER BY completadas DESC, tecnico;
