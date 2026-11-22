-- ============================================================================
--  Módulo Usuarios · /usuarios
--
--  Las cuatro tarjetas y el listado, tal como los ejecuta
--  `api/src/modulos/usuarios.ts`. Todas son SELECT.
--
--  Idea clave: aquí solo salen las cuentas del EQUIPO. Las cuentas con rol
--  `cliente` se administran desde el módulo Clientes, por eso todas las
--  consultas llevan `WHERE r.nombre <> 'cliente'`.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- TARJETAS 1 a 4 · activos · administradores · invitaciones · sin ingresar
-- ---------------------------------------------------------------------------
WITH base AS (
  SELECT u.id, u.estado::text AS estado, r.nombre AS rol, u.ultimo_acceso
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
   WHERE r.nombre <> 'cliente'
)
SELECT
  count(*) FILTER (WHERE estado = 'activo')::int                   AS activos,
  count(*)::int                                                    AS total,
  count(*) FILTER (WHERE rol = 'administrador')::int               AS administradores,
  count(*) FILTER (WHERE estado = 'invitacion_enviada')::int       AS invitaciones_pendientes,
  count(*) FILTER (WHERE ultimo_acceso < now() - interval '30 days')::int
                                                                   AS sin_ingresar_hace_30_dias,
  count(*) FILTER (WHERE ultimo_acceso IS NULL)::int               AS nunca_han_entrado
FROM base;


-- ---------------------------------------------------------------------------
-- PESTAÑAS · Todos / Administradores / Coordinación / Técnicos / Inactivos
-- ---------------------------------------------------------------------------
SELECT r.nombre AS rol,
       count(*)::int                                                     AS cuentas,
       count(*) FILTER (WHERE u.estado = 'activo')::int                  AS activas,
       count(*) FILTER (WHERE u.estado IN ('inactivo', 'bloqueado'))::int AS inactivas
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
 WHERE r.nombre <> 'cliente'
 GROUP BY r.nombre
 ORDER BY cuentas DESC, rol;


-- ---------------------------------------------------------------------------
-- LISTADO · Lo que se ve en la tabla
--
-- El orden pone primero a quien entró hace poco y deja al final a quien nunca
-- ha entrado: `(ultimo_acceso IS NULL)` ordena false antes que true.
-- ---------------------------------------------------------------------------
SELECT trim(u.nombres || ' ' || u.apellidos) AS nombre,
       u.correo, r.nombre AS rol, u.estado::text AS estado,
       u.ultimo_acceso
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
 WHERE r.nombre <> 'cliente'
 ORDER BY (u.ultimo_acceso IS NULL), u.ultimo_acceso DESC, nombre
 LIMIT 12;


-- ---------------------------------------------------------------------------
-- PERMISOS · Qué puede hacer cada rol (lo que decide el menú del portal)
-- ---------------------------------------------------------------------------
SELECT r.nombre AS rol, count(rp.permiso_id)::int AS permisos,
       string_agg(DISTINCT p.modulo, ', ' ORDER BY p.modulo) AS modulos
  FROM roles r
  LEFT JOIN roles_permisos rp ON rp.rol_id = r.id
  LEFT JOIN permisos p        ON p.id = rp.permiso_id
 GROUP BY r.id, r.nombre
 ORDER BY permisos DESC;

-- El detalle, permiso por permiso
SELECT r.nombre AS rol, p.modulo, p.nombre AS permiso, p.descripcion
  FROM roles_permisos rp
  JOIN roles r    ON r.id = rp.rol_id
  JOIN permisos p ON p.id = rp.permiso_id
 ORDER BY r.nombre, p.modulo, p.nombre;


-- ---------------------------------------------------------------------------
-- EXTRA · Cuentas de clientes (las que NO salen en este módulo)
-- ---------------------------------------------------------------------------
SELECT count(*)::int AS cuentas_de_cliente
  FROM usuarios u JOIN roles r ON r.id = u.rol_id
 WHERE r.nombre = 'cliente';
