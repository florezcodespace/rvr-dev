-- ============================================================================
--  Portal RvR Tecnologías · Catálogos iniciales · Modelo v6
--
--  Carga lo que el sistema necesita para arrancar:
--    · el catálogo de permisos, uno por caso de uso de los diagramas (CA_01_03)
--    · los roles Administrador, Coordinador, Cliente y Técnico con sus permisos
--    · las cuentas del personal y la del técnico de pruebas
--    · el catálogo de servicios de RvR Tecnologías
--
--  Es idempotente (ON CONFLICT): se puede correr dos veces sin duplicar nada.
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------- roles
INSERT INTO rol (id, nombre, descripcion, estado) VALUES
  (1, 'Administrador', 'Acceso completo al portal administrativo: configuración, operación y reportes', 'activo'),
  (2, 'Cliente',       'Portal del cliente: catálogo, solicitudes, cotizaciones, órdenes y perfil', 'activo'),
  (3, 'Técnico',       'Aplicación móvil: órdenes asignadas, visitas y reporte técnico', 'activo'),
  (4, 'Coordinador',   'Operación diaria: cotizaciones, órdenes, agenda y clientes, sin configuración', 'activo')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- permisos
-- Un permiso por caso de uso. El nombre es la acción; el módulo, el
-- subproceso. La API los exige como «modulo.nombre» (ej. roles.registrar).
INSERT INTO permiso (nombre, modulo, descripcion) VALUES
  -- Configuración · Gestión de Roles
  ('listar',         'roles', 'HU_03 · Listar los roles'),
  ('buscar',         'roles', 'HU_02 · Buscar roles por nombre o estado'),
  ('registrar',      'roles', 'HU_01 · Registrar un rol con sus permisos'),
  ('editar',         'roles', 'HU_04 · Editar un rol y sus permisos'),
  ('ver_detalle',    'roles', 'HU_06 · Ver el detalle de un rol'),
  ('cambiar_estado', 'roles', 'HU_05 · Activar o inactivar un rol'),
  -- Configuración · Gestión de Permisos
  ('listar',         'permisos', 'HU_68 · Listar los permisos'),
  ('buscar',         'permisos', 'HU_67 · Buscar permisos por nombre, módulo o estado'),
  ('registrar',      'permisos', 'HU_66 · Registrar un permiso'),
  ('editar',         'permisos', 'HU_69 · Editar un permiso'),
  ('ver_detalle',    'permisos', 'HU_71 · Ver el detalle de un permiso y sus roles'),
  ('cambiar_estado', 'permisos', 'HU_70 · Activar o inactivar un permiso'),
  -- Usuarios · Gestión de Usuarios
  ('listar',         'usuarios', 'HU_09 · Listar los usuarios'),
  ('buscar',         'usuarios', 'HU_08 · Buscar usuarios'),
  ('registrar',      'usuarios', 'HU_07 · Registrar un usuario'),
  ('editar',         'usuarios', 'HU_10 · Editar un usuario'),
  ('ver_detalle',    'usuarios', 'HU_12 · Ver el detalle de un usuario'),
  ('cambiar_estado', 'usuarios', 'HU_11 · Activar o inactivar un usuario'),
  -- Usuarios · Gestión de Acceso
  ('consultar',      'accesos',  'HU_74 · Consultar el registro de accesos'),
  -- Servicios · Catálogo de Servicios
  ('listar',         'servicios', 'HU_17 · Listar los servicios'),
  ('buscar',         'servicios', 'HU_16 · Buscar servicios'),
  ('registrar',      'servicios', 'HU_15 · Registrar un servicio'),
  ('editar',         'servicios', 'HU_18 · Editar un servicio'),
  ('ver_detalle',    'servicios', 'HU_20 · Ver el detalle de un servicio'),
  ('cambiar_estado', 'servicios', 'HU_19 · Activar o inactivar un servicio'),
  -- Servicios · Gestión de Técnicos
  ('listar',         'tecnicos', 'HU_24 · Listar los técnicos'),
  ('buscar',         'tecnicos', 'HU_23 · Buscar técnicos'),
  ('registrar',      'tecnicos', 'HU_22 · Registrar un técnico'),
  ('editar',         'tecnicos', 'HU_25 · Editar un técnico'),
  ('ver_detalle',    'tecnicos', 'HU_27 · Ver el detalle de un técnico'),
  ('cambiar_estado', 'tecnicos', 'HU_26 · Activar o inactivar un técnico'),
  -- Servicios · Gestión de Horarios Técnicos
  ('registrar',      'disponibilidad', 'HU_28 · Registrar la disponibilidad de un técnico'),
  ('consultar',      'disponibilidad', 'HU_29 · Consultar la disponibilidad de los técnicos'),
  ('cambiar_estado', 'disponibilidad', 'HU_30 · Cambiar el estado de una franja'),
  -- Venta – Órdenes · Gestión de Clientes
  ('listar',         'clientes', 'HU_33 · Listar los clientes'),
  ('buscar',         'clientes', 'HU_32 · Buscar clientes'),
  ('registrar',      'clientes', 'HU_31 · Registrar un cliente'),
  ('editar',         'clientes', 'HU_34 · Editar un cliente'),
  ('ver_detalle',    'clientes', 'HU_35 · Ver el detalle de un cliente'),
  ('cambiar_estado', 'clientes', 'HU_83 · Activar o inactivar un cliente'),
  -- Venta – Órdenes · Gestión de Cotizaciones
  ('listar',             'cotizaciones', 'HU_38 · Listar las cotizaciones'),
  ('buscar',             'cotizaciones', 'HU_37 · Buscar cotizaciones'),
  ('registrar',          'cotizaciones', 'HU_36 · Registrar una cotización'),
  ('editar',             'cotizaciones', 'HU_39 · Editar una cotización'),
  ('ver_detalle',        'cotizaciones', 'HU_41 · Ver el detalle de una cotización'),
  ('enviar',             'cotizaciones', 'HU_81 · Enviar la cotización al cliente'),
  ('registrar_decision', 'cotizaciones', 'HU_40 · Registrar la aprobación o el rechazo'),
  -- Venta – Órdenes · Gestión de Órdenes de Servicio
  ('listar',                  'ordenes', 'HU_46 · Listar las órdenes de servicio'),
  ('buscar',                  'ordenes', 'HU_45 · Buscar órdenes de servicio'),
  ('registrar',               'ordenes', 'HU_44 · Registrar una orden desde una cotización aprobada'),
  ('registrar_observaciones', 'ordenes', 'HU_47 · Registrar observaciones de la orden'),
  ('cambiar_estado',          'ordenes', 'HU_48 · Cambiar el estado de la orden'),
  ('cambiar_estado_item',     'ordenes', 'HU_49 · Cambiar el estado de un ítem de la orden'),
  ('ver_detalle',             'ordenes', 'HU_50 · Ver el detalle de la orden'),
  -- Venta – Órdenes · Agendamiento
  ('consultar',      'agenda', 'HU_52 · Consultar el calendario de visitas'),
  ('agendar',        'agenda', 'HU_51 · Agendar una visita técnica'),
  ('reprogramar',    'agenda', 'HU_53 · Reprogramar o reasignar una visita'),
  ('cambiar_estado', 'agenda', 'HU_54 · Cambiar el estado de una visita'),
  -- Venta – Órdenes · Gestión de Ventas
  ('consultar_estado', 'ventas', 'HU_56 · Consultar el estado de pago'),
  ('registrar',        'ventas', 'HU_55 · Registrar la venta de una orden'),
  ('cambiar_estado',   'ventas', 'HU_57 · Cambiar el estado de pago (anular)'),
  -- Venta – Órdenes · Gestión de Abonos
  ('listar',    'abonos', 'HU_59 · Listar los abonos'),
  ('registrar', 'abonos', 'HU_58 · Registrar un abono'),
  -- Dashboard
  ('ordenes',           'reportes',     'HU_60 · Generar el reporte de órdenes de servicio'),
  ('tecnicos',          'reportes',     'HU_61 · Generar el reporte de servicios por técnico'),
  ('exportar',          'reportes',     'HU_62 · Exportar reportes (PDF / Excel)'),
  ('servicios_ordenes', 'indicadores',  'HU_63 · Servicios realizados y órdenes por estado'),
  ('mas_solicitados',   'indicadores',  'HU_64 · Servicios más solicitados y técnicos con más servicios'),
  ('consultar',         'estadisticas', 'HU_65 · Estadísticas generales del sistema'),
  -- Portal del cliente
  ('consultar_perfil',       'portal', 'HU_76 · Consultar mis datos de perfil'),
  ('actualizar_perfil',      'portal', 'HU_77 · Actualizar mis datos de perfil'),
  ('solicitar_servicios',    'portal', 'HU_78 · Solicitar los servicios que necesito'),
  ('consultar_cotizaciones', 'portal', 'HU_79 · Consultar mis cotizaciones'),
  ('decidir_cotizacion',     'portal', 'HU_80 · Aprobar o rechazar mi cotización'),
  ('consultar_ordenes',      'portal', 'HU_82 · Consultar mis órdenes de servicio'),
  -- Aplicación móvil del técnico
  ('acceso',                 'movil', 'Móvil HU_01 / HU_02 · Iniciar y cerrar sesión desde el móvil'),
  ('consultar_ordenes',      'movil', 'Móvil HU_03 · Consultar órdenes asignadas'),
  ('registrar_visita',       'movil', 'Móvil HU_04 / HU_05 · Registrar inicio y finalización de visita'),
  ('reporte_tecnico',        'movil', 'Móvil HU_06 / HU_07 / HU_08 · Diagnóstico, materiales y solución'),
  ('solicitar_recotizacion', 'movil', 'Móvil HU_11 · Solicitar recotización por repuesto'),
  ('actualizar_estado',      'movil', 'Móvil HU_09 · Actualizar el estado de la orden'),
  ('consultar_historial',    'movil', 'Móvil HU_10 · Consultar el historial de la orden')
ON CONFLICT (nombre, modulo) DO NOTHING;

-- ------------------------------------------------------- permisos por rol
-- Administrador: todo lo del portal administrativo.
INSERT INTO rol_x_permiso (rol_id, permiso_id)
SELECT 1, id FROM permiso WHERE modulo NOT IN ('portal', 'movil')
ON CONFLICT DO NOTHING;

-- Cliente: solo su portal.
INSERT INTO rol_x_permiso (rol_id, permiso_id)
SELECT 2, id FROM permiso WHERE modulo = 'portal'
ON CONFLICT DO NOTHING;

-- Técnico: solo la aplicación móvil.
INSERT INTO rol_x_permiso (rol_id, permiso_id)
SELECT 3, id FROM permiso WHERE modulo = 'movil'
ON CONFLICT DO NOTHING;

-- Coordinador: la operación, sin configuración ni cuentas.
INSERT INTO rol_x_permiso (rol_id, permiso_id)
SELECT 4, id FROM permiso
 WHERE modulo IN ('disponibilidad', 'cotizaciones', 'ordenes', 'agenda', 'indicadores', 'estadisticas')
    OR (modulo IN ('servicios', 'tecnicos') AND nombre IN ('listar', 'buscar', 'ver_detalle'))
    OR (modulo = 'clientes' AND nombre <> 'cambiar_estado')
    OR (modulo = 'ventas'   AND nombre IN ('consultar_estado', 'registrar'))
    OR (modulo = 'abonos')
    OR (modulo = 'reportes')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------- usuarios
-- Contraseñas cifradas con bcrypt (coste 10). En texto plano, para pruebas:
--   ricardo.vargas@rvrtec.co  ->  RvR2026*admin     (Administrador)
--   laura.gomez@rvrtec.co     ->  RvR2026*coord     (Coordinador)
--   julian.mora@rvrtec.co     ->  RvR2026*tecnico   (Técnico, app móvil)
INSERT INTO usuario
  (id, rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
VALUES
  (1, 1, 'rvargas', 'ricardo.vargas@rvrtec.co',
      '$2b$10$3FaRm7JlzxR/O1TudA3AOul/fFb8NJibJNUsS8HGO9etBHm.g/Cke',
      'Ricardo', 'Vargas', '3015270761', 'activo'),
  (2, 4, 'lgomez', 'laura.gomez@rvrtec.co',
      '$2b$10$t./dFGPMrLpXarAk.IrOkeprFatIT0YWsGOcYCHLhKaN3ydmQKt.K',
      'Laura', 'Gómez', '3012345678', 'activo'),
  (3, 3, 'jmora', 'julian.mora@rvrtec.co',
      '$2b$10$QkjR7Ikew/uA.DbYd/aqGuKuGwtGd.haFEHSa6l6Z3rabA1iYXeZe',
      'Julián', 'Mora', '3009876543', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Ficha del técnico de pruebas, con su cuenta para la app móvil.
INSERT INTO tecnico (id, documento_identidad, nombres, apellidos, especialidad, telefono, correo, estado, usuario_id)
VALUES (1, '1036654321', 'Julián', 'Mora', 'Redes y servidores', '3009876543',
        'julian.mora@rvrtec.co', 'activo', 3)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------- servicios
-- Los cinco frentes de la ficha técnica: mantenimiento de computadores e
-- impresoras, servidores, redes IP, cámaras de seguridad y alarmas.
INSERT INTO servicio (id, nombre, descripcion, precio_base, categoria, estado) VALUES
  (1,  'Mantenimiento preventivo de computador',
       'Limpieza física interna, cambio de pasta térmica, optimización de software e informe técnico por equipo.',
       120000, 'Mantenimiento', 'activo'),
  (2,  'Mantenimiento correctivo de computador',
       'Diagnóstico y reparación de fallas en equipos de escritorio o portátiles.',
       180000, 'Mantenimiento', 'activo'),
  (3,  'Mantenimiento preventivo de impresora',
       'Limpieza de cabezales, calibración, revisión de rodillos y del sistema de tinta o tóner.',
       95000, 'Mantenimiento', 'activo'),
  (4,  'Formateo e instalación de sistema operativo',
       'Respaldo previo de la información, instalación limpia y configuración de ofimática.',
       110000, 'Mantenimiento', 'activo'),
  (5,  'Instalación y configuración de servidor',
       'Montaje físico, sistema operativo de servidor, roles, usuarios y respaldo inicial.',
       1500000, 'Servidores', 'activo'),
  (6,  'Mantenimiento de servidor',
       'Revisión de hardware, actualizaciones, verificación de respaldos y del estado de los discos.',
       450000, 'Servidores', 'activo'),
  (7,  'Configuración de red IP',
       'Direccionamiento, segmentación, configuración de router, switch y red Wi-Fi.',
       280000, 'Redes', 'activo'),
  (8,  'Instalación de punto de red',
       'Cableado, ponchado y certificación de un punto de datos.',
       85000, 'Redes', 'activo'),
  (9,  'Instalación de cámara de seguridad',
       'Montaje, cableado y configuración de una cámara con acceso desde el celular.',
       250000, 'Cámaras de seguridad', 'activo'),
  (10, 'Kit de videovigilancia de 4 cámaras',
       'Grabador DVR/NVR, cuatro cámaras, instalación completa y configuración remota.',
       1650000, 'Cámaras de seguridad', 'activo'),
  (11, 'Instalación de sistema de alarma',
       'Panel de control, sensores de movimiento y apertura, sirena y configuración de la app.',
       900000, 'Alarmas', 'activo'),
  (12, 'Mantenimiento de sistema de alarma',
       'Prueba de sensores, cambio de baterías, revisión del panel y de la sirena.',
       160000, 'Alarmas', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Las identidades quedan por encima de los ids cargados a mano; si no, el
-- primer INSERT desde la aplicación chocaría con la llave primaria.
SELECT setval(pg_get_serial_sequence('rol', 'id'),      (SELECT max(id) FROM rol));
SELECT setval(pg_get_serial_sequence('usuario', 'id'),  (SELECT max(id) FROM usuario));
SELECT setval(pg_get_serial_sequence('tecnico', 'id'),  (SELECT max(id) FROM tecnico));
SELECT setval(pg_get_serial_sequence('servicio', 'id'), (SELECT max(id) FROM servicio));

COMMIT;
