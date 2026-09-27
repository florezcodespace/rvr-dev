-- ============================================================================
--  Portal RvR Tecnologías · Carga inicial
--
--  Solo catálogos: roles, permisos, sus asignaciones, categorías y servicios,
--  más las cuentas con las que se entra al portal. Órdenes, agendamientos,
--  ventas y abonos arrancan vacíos y se crean desde la aplicación.
--
--  Es idempotente: se puede volver a ejecutar sin duplicar nada.
--  Ejecutar con:  psql "<cadena de conexión>" -f db/02-catalogos.sql
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------- roles

INSERT INTO roles (id, nombre, descripcion, estado) VALUES
  (1, 'administrador', 'Acceso completo al portal y a la configuración', 'activo'),
  (2, 'coordinacion',  'Agenda, órdenes y seguimiento de la operación',  'activo'),
  (3, 'tecnico',       'Sus órdenes asignadas y los diagnósticos',       'activo'),
  (4, 'facturacion',   'Ventas, abonos y cartera',                       'activo'),
  (5, 'soporte',       'Consulta de órdenes y atención al cliente',      'activo'),
  (6, 'cliente',       'Consulta del estado de sus propias órdenes',     'activo')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- permisos
-- Van quemados en la base, sin CRUD en la aplicación (corrección de Emanuel).
-- Convención del nombre: <modulo>.<accion>.

INSERT INTO permisos (id, nombre, modulo, descripcion, estado) VALUES
  ( 1, 'usuarios.ver',       'usuarios',   'Consultar el listado de usuarios',        'activo'),
  ( 2, 'usuarios.crear',     'usuarios',   'Invitar usuarios al portal',              'activo'),
  ( 3, 'usuarios.editar',    'usuarios',   'Cambiar rol y estado de un usuario',      'activo'),
  ( 4, 'servicios.ver',      'servicios',  'Consultar el catálogo de servicios',      'activo'),
  ( 5, 'servicios.crear',    'servicios',  'Crear servicios y categorías',            'activo'),
  ( 6, 'servicios.editar',   'servicios',  'Editar precio, estado y categoría',       'activo'),
  ( 7, 'agenda.ver',         'agenda',     'Consultar los agendamientos',             'activo'),
  ( 8, 'agenda.crear',       'agenda',     'Programar una visita',                    'activo'),
  ( 9, 'agenda.editar',      'agenda',     'Reprogramar o cancelar una visita',       'activo'),
  (10, 'ordenes.ver',        'ordenes',    'Consultar las órdenes de servicio',       'activo'),
  (11, 'ordenes.crear',      'ordenes',    'Abrir una orden de servicio',             'activo'),
  (12, 'ordenes.editar',     'ordenes',    'Cambiar estado y técnico de una orden',   'activo'),
  (13, 'ordenes.propias',    'ordenes',    'Ver únicamente las órdenes asignadas',    'activo'),
  (14, 'diagnosticos.ver',   'diagnostico','Consultar los diagnósticos de una orden', 'activo'),
  (15, 'diagnosticos.crear', 'diagnostico','Registrar el diagnóstico de una visita',  'activo'),
  (16, 'ventas.ver',         'ventas',     'Consultar ventas y cartera',              'activo'),
  (17, 'ventas.crear',       'ventas',     'Generar la venta de una orden',           'activo'),
  (18, 'abonos.ver',         'abonos',     'Consultar los abonos de una venta',       'activo'),
  (19, 'abonos.crear',       'abonos',     'Registrar un abono',                      'activo'),
  (20, 'reportes.ver',       'reportes',   'Consultar indicadores y reportes',        'activo'),
  (21, 'config.ver',         'config',     'Consultar la configuración del portal',   'activo'),
  (22, 'config.editar',      'config',     'Modificar la configuración del portal',   'activo')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------- roles_permisos
-- El administrador tiene todo; los demás, lo que su cargo necesita.

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos
ON CONFLICT DO NOTHING;

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE nombre IN (
  'usuarios.ver', 'servicios.ver', 'agenda.ver', 'agenda.crear', 'agenda.editar',
  'ordenes.ver', 'ordenes.crear', 'ordenes.editar', 'diagnosticos.ver',
  'ventas.ver', 'abonos.ver', 'reportes.ver'
) ON CONFLICT DO NOTHING;

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 3, id FROM permisos WHERE nombre IN (
  'agenda.ver', 'ordenes.propias', 'diagnosticos.ver', 'diagnosticos.crear',
  'servicios.ver'
) ON CONFLICT DO NOTHING;

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 4, id FROM permisos WHERE nombre IN (
  'ordenes.ver', 'ventas.ver', 'ventas.crear', 'abonos.ver', 'abonos.crear',
  'reportes.ver', 'servicios.ver'
) ON CONFLICT DO NOTHING;

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 5, id FROM permisos WHERE nombre IN (
  'ordenes.ver', 'agenda.ver', 'servicios.ver', 'diagnosticos.ver'
) ON CONFLICT DO NOTHING;

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 6, id FROM permisos WHERE nombre IN ('ordenes.propias')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------- categorías

INSERT INTO categorias (id, nombre, descripcion, estado) VALUES
  (1, 'Soporte',        'Mantenimiento preventivo y correctivo de equipos', 'activo'),
  (2, 'Infraestructura','Redes, cableado estructurado y servidores',        'activo'),
  (3, 'Seguridad',      'CCTV, alarmas y control de acceso',                'activo'),
  (4, 'Datos',          'Respaldo, recuperación y migración de información','activo')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------- servicios
-- Precios de referencia en pesos colombianos.

INSERT INTO servicios (id, categoria_id, nombre, descripcion, precio, estado) VALUES
  (1, 1, 'Mantenimiento preventivo de equipo',
        'Limpieza física, optimización de software e informe técnico por equipo.',
        180000.00, 'activo'),
  (2, 1, 'Mantenimiento correctivo',
        'Diagnóstico y reparación de falla en computador de escritorio o portátil.',
        220000.00, 'activo'),
  (3, 1, 'Formateo e instalación de sistema operativo',
        'Respaldo previo, instalación limpia y configuración de ofimática.',
        150000.00, 'activo'),
  (4, 1, 'Mantenimiento de impresora',
        'Limpieza de cabezales, calibración y revisión de sistema de tinta.',
        130000.00, 'activo'),
  (5, 2, 'Instalación de punto de red',
        'Cableado, ponchado y certificación de un punto de datos.',
        95000.00, 'activo'),
  (6, 2, 'Cableado estructurado por sede',
        'Diseño y montaje de la red de datos, con certificación de puntos.',
        2800000.00, 'activo'),
  (7, 2, 'Montaje y configuración de servidor',
        'Instalación física, sistema operativo, roles y respaldo inicial.',
        1650000.00, 'activo'),
  (8, 2, 'Configuración de red y router',
        'Segmentación, claves, control de acceso y priorización de tráfico.',
        280000.00, 'activo'),
  (9, 3, 'Instalación de cámara CCTV',
        'Montaje, cableado y configuración de una cámara de videovigilancia.',
        320000.00, 'activo'),
  (10, 3, 'Sistema CCTV de cuatro cámaras',
        'Kit completo con grabador, instalación y acceso remoto desde el celular.',
        1850000.00, 'activo'),
  (11, 3, 'Instalación de sistema de alarma',
        'Central, sensores de movimiento y apertura, sirena y configuración.',
        980000.00, 'activo'),
  (12, 3, 'Mantenimiento de sistema de seguridad',
        'Revisión de cámaras, sensores y grabador, con ajuste de ángulos.',
        240000.00, 'activo'),
  (13, 4, 'Respaldo y migración de información',
        'Copia verificada de datos y traslado al equipo o servidor nuevo.',
        190000.00, 'activo'),
  (14, 4, 'Recuperación de datos',
        'Intento de recuperación sobre disco con falla lógica.',
        450000.00, 'activo')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------- usuarios
-- Contraseñas cifradas con bcrypt (coste 10). En texto plano, para pruebas:
--   ricardo.vargas@rvrtec.co  ->  RvR2026*admin
--   laura.gomez@rvrtec.co     ->  RvR2026*coord
--   julian.mora@rvrtec.co     ->  RvR2026*tecnico

INSERT INTO usuarios
  (id, rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
VALUES
  (1, 1, 'ricardo.vargas', 'ricardo.vargas@rvrtec.co',
      '$2b$10$/4vb.UQVHssXYf9FAgbmuupO/Wo8gAQ7U64bYKvJyxfkgsbxhQo9G',
      'Ricardo', 'Vargas', '3015270761', 'activo'),
  (2, 2, 'laura.gomez', 'laura.gomez@rvrtec.co',
      '$2b$10$oJYwPuSSB0NeiYiOjrc0/.JUgcYRovD/4B/bssSycBwlR715I9EOO',
      'Laura', 'Gómez', '3012345678', 'activo'),
  (3, 3, 'julian.mora', 'julian.mora@rvrtec.co',
      '$2b$10$3Q4uriqhsXl8nD4.coh1Vur3PLp4bFcHflILTKoq1n2SNHxL5AHNO',
      'Julián', 'Mora', '3009876543', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Las secuencias de identidad quedan por encima de los ids cargados a mano,
-- si no el primer INSERT desde la aplicación chocaría con la llave primaria.
SELECT setval(pg_get_serial_sequence('roles', 'id'),      (SELECT max(id) FROM roles));
SELECT setval(pg_get_serial_sequence('permisos', 'id'),   (SELECT max(id) FROM permisos));
SELECT setval(pg_get_serial_sequence('categorias', 'id'), (SELECT max(id) FROM categorias));
SELECT setval(pg_get_serial_sequence('servicios', 'id'),  (SELECT max(id) FROM servicios));
SELECT setval(pg_get_serial_sequence('usuarios', 'id'),   (SELECT max(id) FROM usuarios));

COMMIT;
