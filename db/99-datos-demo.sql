-- ============================================================================
--  Portal RvR Tecnologías · Datos de demostración · Modelo v6
--
--  ⚠ SOLO para la base de pruebas o de sustentación: todo es inventado.
--
--  Recorre el flujo completo de la ficha técnica, con fechas relativas a hoy
--  para que los indicadores nunca salgan en cero:
--    cliente → solicitud / cotización (servicios y repuestos) → envío →
--    aprobación → orden (un ítem por ítem cotizado) → venta con anticipo →
--    visita agendada en una franja del técnico → diagnóstico, materiales y
--    solución → abonos hasta pagar → orden finalizada.
--
--  Cuentas de prueba que crea (además de las de 02-catalogos.sql):
--    ana.suarez@gmail.com      ->  RvR2026*cliente   (Cliente, portal)
--    carlos.restrepo@gmail.com ->  RvR2026*cliente   (Cliente, portal)
--    sofia.herrera@rvrtec.co   ->  RvR2026*tecnico   (Técnico, app móvil)
-- ============================================================================

BEGIN;

SELECT setseed(0.71);

-- ------------------------------------------------------------- cuentas
INSERT INTO usuario (id, rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado) VALUES
  (4, 3, 'sherrera', 'sofia.herrera@rvrtec.co',
      '$2b$10$QkjR7Ikew/uA.DbYd/aqGuKuGwtGd.haFEHSa6l6Z3rabA1iYXeZe', 'Sofía', 'Herrera', '3104567890', 'activo'),
  (5, 2, 'asuarez', 'ana.suarez@gmail.com',
      '$2b$10$/ox1U8Be71i1oNtIpdbHxuxIYdN.szDeVlaMozzmN.Sz5/dOvqH4O', 'Ana María', 'Suárez', '3157894561', 'activo'),
  (6, 2, 'crestrepo', 'carlos.restrepo@gmail.com',
      '$2b$10$/ox1U8Be71i1oNtIpdbHxuxIYdN.szDeVlaMozzmN.Sz5/dOvqH4O', 'Carlos', 'Restrepo', '3001237788', 'activo'),
  (7, 4, 'dcano', 'daniela.cano@rvrtec.co',
      '$2b$10$t./dFGPMrLpXarAk.IrOkeprFatIT0YWsGOcYCHLhKaN3ydmQKt.K', 'Daniela', 'Cano', '3128889900', 'inactivo')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------- técnicos
INSERT INTO tecnico (id, documento_identidad, nombres, apellidos, especialidad, telefono, correo, estado, usuario_id) VALUES
  (2, '1017223344', 'Sofía',   'Herrera',  'Cámaras de seguridad y alarmas', '3104567890', 'sofia.herrera@rvrtec.co', 'activo', 4),
  (3, '71654987',   'Andrés',  'Zapata',   'Mantenimiento de computadores e impresoras', '3116549870', 'andres.zapata@gmail.com', 'activo', NULL),
  (4, '1128445566', 'Valentina','Ospina',  'Redes IP y cableado estructurado', '3137778899', 'vale.ospina@gmail.com', 'activo', NULL),
  (5, '98765432',   'Mauricio','Londoño',  'Servidores', '3145556677', 'mlondono@gmail.com', 'inactivo', NULL)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------- clientes
INSERT INTO cliente (id, documento_identidad, nombres, apellidos, telefono, direccion, correo, fecha_registro, usuario_id, estado) VALUES
  (1,  '43876512',   'Ana María', 'Suárez',    '3157894561', 'Cra. 43A # 18-95, El Poblado',  'ana.suarez@gmail.com',      now() - interval '170 days', 5, 'activo'),
  (2,  '1036987456', 'Carlos',    'Restrepo',  '3001237788', 'Cl. 50 # 70-21, Laureles',      'carlos.restrepo@gmail.com', now() - interval '150 days', 6, 'activo'),
  (3,  '32456789',   'Luz Elena', 'Martínez',  '3014561237', 'Cl. 10 # 32-11, Envigado',      'luzelena.mtz@hotmail.com',  now() - interval '160 days', NULL, 'activo'),
  (4,  '1152698745', 'Jorge Iván','Gutiérrez', '3205558899', 'Cra. 65 # 48-30, Estadio',      'jorge.gutierrez@outlook.com', now() - interval '140 days', NULL, 'activo'),
  (5,  '70123456',   'Hernán',    'Álvarez',   '3116667788', 'Cl. 33 # 80-15, Belén',         'halvarez@gmail.com',        now() - interval '130 days', NULL, 'activo'),
  (6,  '1040321987', 'Paula Andrea','Rendón',  '3002223344', 'Cra. 80 # 34-50, Calasanz',     'paula.rendon@gmail.com',    now() - interval '120 days', NULL, 'activo'),
  (7,  '8354621',    'Gustavo',   'Mejía',     '3184445566', 'Cl. 90 # 46-20, Aranjuez',      'gmejia@gmail.com',          now() - interval '110 days', NULL, 'activo'),
  (8,  '1017458963', 'Natalia',   'Cardona',   '3017778899', 'Cra. 70 # 1-45, Guayabal',      'natycardona@gmail.com',     now() - interval '95 days',  NULL, 'activo'),
  (9,  '43215678',   'Beatriz',   'Ochoa',     '3125559988', 'Cl. 37 Sur # 43-12, Envigado',  'bea.ochoa@yahoo.com',       now() - interval '80 days',  NULL, 'activo'),
  (10, '1036654789', 'Santiago',  'Villa',     '3009991122', 'Cra. 52 # 12 Sur-80, Itagüí',   'santivilla@gmail.com',      now() - interval '60 days',  NULL, 'activo'),
  (11, '1152233445', 'Camila',    'Arango',    '3106663344', 'Cl. 44 # 68-10, Carlos E.',     'camila.arango@gmail.com',   now() - interval '40 days',  NULL, 'activo'),
  (12, '71987654',   'Fernando',  'Toro',      '3157771100', 'Cra. 48 # 60-30, Prado',        'ftoro@gmail.com',           now() - interval '25 days',  NULL, 'activo'),
  (13, '1001234567', 'Mariana',   'Quintero',  '3013334455', 'Cl. 7 # 25-40, Sabaneta',       'mquintero@gmail.com',       now() - interval '12 days',  NULL, 'activo'),
  (14, '15478965',   'Ricardo',   'Salazar',   '3188887766', 'Cra. 30 # 5-10, Bello',         'rsalazar@gmail.com',        now() - interval '100 days', NULL, 'inactivo')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('usuario', 'id'), (SELECT max(id) FROM usuario));
SELECT setval(pg_get_serial_sequence('tecnico', 'id'), (SELECT max(id) FROM tecnico));
SELECT setval(pg_get_serial_sequence('cliente', 'id'), (SELECT max(id) FROM cliente));

-- ---------------------------------------------------------- disponibilidad
-- Cuatro franjas por día hábil para cada técnico activo, de hace 120 días a
-- dentro de 21. Algunas quedan bloqueadas por permisos o incapacidades.
INSERT INTO disponibilidad (tecnico_id, fecha, hora_inicio, hora_fin, estado, motivo)
SELECT t.id, d::date, f.inicio, f.fin,
       CASE WHEN random() < 0.04 THEN 'bloqueada' ELSE 'disponible' END,
       NULL
  FROM tecnico t
 CROSS JOIN generate_series(current_date - 120, current_date + 21, interval '1 day') d
 CROSS JOIN (VALUES (time '08:00', time '10:00'), (time '10:00', time '12:00'),
                    (time '14:00', time '16:00'), (time '16:00', time '18:00')) f(inicio, fin)
 WHERE t.estado = 'activo' AND extract(isodow FROM d) < 6;

UPDATE disponibilidad SET motivo = (ARRAY['Permiso personal', 'Cita médica', 'Capacitación', 'Incapacidad'])[1 + floor(random() * 4)::int]
 WHERE estado = 'bloqueada';

-- ------------------------------------------------ flujo comercial completo
ALTER TABLE orden DISABLE TRIGGER tg_historial_orden;

DO $$
DECLARE
  i             int;
  n_cot         int := 64;
  cli           int;
  fecha_cot     timestamp;
  cot_id        int;
  ord_id        int;
  venta_id_     int;
  total         numeric;
  anticipo      numeric;
  estado_cot    text;
  estado_ord    text;
  destino       float;
  tec           int;
  franja        record;
  visita        timestamp;
  srv           record;
  items         int;
  metodo        text;
  metodos       text[] := ARRAY['Transferencia', 'Efectivo', 'Nequi', 'Daviplata', 'Tarjeta'];
  problemas     text[] := ARRAY[
    'El computador se apaga solo y hace mucho ruido.',
    'La impresora mancha las hojas y no toma el papel.',
    'Necesitamos cámaras para la entrada y el parqueadero.',
    'La red Wi-Fi no llega a las oficinas del segundo piso.',
    'El servidor está lento y no sabemos si los respaldos funcionan.',
    'Queremos una alarma para el local antes de fin de mes.',
    'El portátil no enciende después de una actualización.',
    'Hay que instalar tres puntos de red en la bodega nueva.'];
  hallazgos     text[] := ARRAY[
    'Ventilador del procesador obstruido y pasta térmica seca; temperatura de 92 °C en carga.',
    'Rodillo de arrastre desgastado y cabezal con residuos de tinta.',
    'Cableado existente en mal estado; se requiere canaleta nueva en el recorrido.',
    'Router del proveedor en modo puente mal configurado; canal Wi-Fi saturado.',
    'Disco del arreglo con sectores reasignados y respaldo programado detenido.',
    'Sensores de apertura sin batería y panel sin comunicación con la app.',
    'Sistema operativo dañado por actualización interrumpida; disco en buen estado.'];
  soluciones    text[] := ARRAY[
    'Limpieza completa, cambio de pasta térmica y ventilador; temperatura estable en 58 °C.',
    'Cambio de rodillo, limpieza de cabezal y calibración; impresión de prueba correcta.',
    'Instalación de canaleta y cableado nuevo; puntos certificados.',
    'Reconfiguración del router, cambio de canal y ampliación con punto de acceso.',
    'Reemplazo del disco, reconstrucción del arreglo y reactivación de respaldos diarios.',
    'Cambio de baterías, reprogramación del panel y prueba con la central.',
    'Reinstalación del sistema con respaldo previo de la información del cliente.'];
  materiales    text[] := ARRAY['Pasta térmica', 'Canaleta 2 m', 'Conector RJ45', 'Cable UTP cat 6 (m)',
                                'Batería de litio 3 V', 'Rodillo de arrastre', 'Disco duro 1 TB', 'Chazos y tornillos'];
  repuestos     text[] := ARRAY['Disco sólido 480 GB', 'Fuente de poder 500 W', 'Cable UTP cat 6 (caja 305 m)',
                                'Disco duro 2 TB para DVR', 'Batería de respaldo 12 V', 'Memoria RAM 8 GB'];
  precios_rep   numeric[] := ARRAY[210000, 180000, 650000, 320000, 95000, 160000];
  k             int;
  dias_atras    int;
  sin_orden     boolean := false;
BEGIN
  FOR i IN 1..n_cot LOOP
    visita := NULL;
    tec := NULL;
    -- Más actividad reciente que antigua
    dias_atras := floor(power(random(), 1.9) * 170)::int + 1;
    -- En horario de oficina: entre las 8:00 y las 17:00
    fecha_cot  := date_trunc('day', now() - make_interval(days => dias_atras))
                  + make_interval(hours => 8 + (floor(random() * 10))::int);
    cli := 1 + floor(random() * 13)::int;           -- el 14 está inactivo

    destino := random();
    estado_cot := CASE
      -- Lo de ayer aún no tiene respuesta: así ninguna fecha derivada queda en el futuro
      WHEN dias_atras < 2 THEN CASE WHEN destino < 0.5 THEN 'solicitada' ELSE 'pendiente' END
      WHEN destino < 0.15 THEN 'rechazada'
      WHEN dias_atras < 12 AND destino < 0.40 THEN 'solicitada'
      WHEN dias_atras < 25 AND destino < 0.60 THEN 'pendiente'
      ELSE 'aprobada' END;

    INSERT INTO cotizacion (cliente_id, fecha_cotizacion, estado, origen, descripcion, direccion,
                            fecha_envio, fecha_respuesta, motivo_rechazo, respondida_por)
    VALUES (cli, fecha_cot, estado_cot,
            CASE WHEN cli IN (1, 2) OR random() < 0.3 THEN 'cliente' ELSE 'administrador' END,
            problemas[1 + floor(random() * array_length(problemas, 1))::int],
            (SELECT direccion FROM cliente WHERE id = cli),
            CASE WHEN estado_cot <> 'solicitada' THEN fecha_cot + interval '5 hours' END,
            CASE WHEN estado_cot IN ('aprobada', 'rechazada') THEN fecha_cot + interval '1 day 3 hours' END,
            CASE WHEN estado_cot = 'rechazada'
                 THEN (ARRAY['El valor supera el presupuesto', 'Contraté con otra empresa', 'Lo haremos el próximo año'])[1 + floor(random() * 3)::int] END,
            CASE WHEN estado_cot IN ('aprobada', 'rechazada') THEN CASE WHEN cli IN (1, 2) THEN cli + 4 ELSE 1 END END)
    RETURNING id INTO cot_id;

    -- Ítems: servicios del catálogo con el precio base congelado
    items := 1 + floor(random() * 2.3)::int;
    FOR srv IN SELECT id, precio_base FROM servicio WHERE estado = 'activo' ORDER BY random() LIMIT items LOOP
      INSERT INTO detalle_cotizacion (cotizacion_id, servicio_id, cantidad, precio_unitario, tipo_item)
      VALUES (cot_id, srv.id,
              CASE WHEN estado_cot = 'solicitada' THEN 1 + floor(random() * 2)::int ELSE 1 + floor(random() * 3)::int END,
              CASE WHEN estado_cot = 'solicitada' THEN 0 ELSE srv.precio_base END,
              'servicio');
    END LOOP;
    -- Algunas llevan un repuesto
    IF estado_cot <> 'solicitada' AND random() < 0.3 THEN
      k := 1 + floor(random() * array_length(repuestos, 1))::int;
      INSERT INTO detalle_cotizacion (cotizacion_id, servicio_id, cantidad, precio_unitario, tipo_item, descripcion)
      VALUES (cot_id, NULL, 1, precios_rep[k], 'repuesto', repuestos[k]);
    END IF;

    CONTINUE WHEN estado_cot <> 'aprobada';
    -- La primera aprobada de esta semana queda sin orden para mostrar HU_44
    IF NOT sin_orden AND dias_atras BETWEEN 2 AND 15 THEN
      sin_orden := true;
      CONTINUE;
    END IF;

    -- ---------------------------------------------------------- orden
    destino := random();
    estado_ord := CASE
      WHEN dias_atras < 8                     THEN 'esperando_anticipo'
      WHEN dias_atras < 35 AND destino < 0.60 THEN 'en_proceso'
      WHEN destino < 0.08                     THEN 'cancelada'
      ELSE 'finalizada' END;

    INSERT INTO orden (fecha_creacion, estado, observaciones)
    VALUES (fecha_cot + interval '1 day 5 hours', estado_ord,
            CASE WHEN random() < 0.4 THEN 'Cliente solicita que llamen antes de llegar.' END)
    RETURNING id INTO ord_id;

    INSERT INTO historial_orden (orden_id, estado_anterior, estado_nuevo, descripcion, usuario_id, fecha)
    VALUES (ord_id, NULL, 'esperando_anticipo', 'Orden creada desde la cotización #' || cot_id, 1,
            fecha_cot + interval '1 day 5 hours');

    INSERT INTO detalle_orden (orden_id, detalle_cotizacion_id, fecha_asignacion, estado_item)
    SELECT ord_id, dc.id, fecha_cot + interval '1 day 5 hours',
           CASE estado_ord WHEN 'finalizada' THEN 'completado'
                           WHEN 'en_proceso' THEN (ARRAY['pendiente', 'en_proceso', 'completado'])[1 + floor(random() * 3)::int]
                           ELSE 'pendiente' END
      FROM detalle_cotizacion dc WHERE dc.cotizacion_id = cot_id;

    SELECT monto_total INTO total FROM cotizacion WHERE id = cot_id;

    -- ---------------------------------------------------------- venta
    IF estado_ord = 'esperando_anticipo' AND random() < 0.4 THEN
      CONTINUE;   -- aún sin venta registrada
    END IF;

    anticipo := round(total * 0.5, -2);
    INSERT INTO ventas (orden_id, monto_total, monto_anticipo, saldo_pendiente, estado_pago, fecha_venta)
    VALUES (ord_id, total, anticipo, total, 'pendiente_anticipo', fecha_cot + interval '1 day 6 hours')
    RETURNING id INTO venta_id_;

    CONTINUE WHEN estado_ord = 'esperando_anticipo';

    IF estado_ord = 'cancelada' THEN
      UPDATE ventas SET estado_pago = 'anulada' WHERE id = venta_id_;
      INSERT INTO historial_orden (orden_id, estado_anterior, estado_nuevo, descripcion, usuario_id, fecha)
      VALUES (ord_id, 'esperando_anticipo', 'cancelada', 'El cliente canceló antes del anticipo', 1,
              fecha_cot + interval '3 days');
      CONTINUE;
    END IF;

    metodo := metodos[1 + floor(random() * 5)::int];
    INSERT INTO abonos (venta_id, monto, tipo_abono, metodo_pago, referencia, fecha_abono)
    VALUES (venta_id_, anticipo, 'anticipo', metodo,
            CASE WHEN metodo <> 'Efectivo' THEN 'REF-' || lpad((100000 + floor(random() * 899999))::text, 6, '0') END,
            fecha_cot + interval '2 days');

    -- ----------------------------------------------------- visita
    -- Las órdenes abiertas van casi todas a Julián Mora (jmora), la cuenta de
    -- prueba de la app móvil, y su visita queda en los próximos días.
    IF estado_ord <> 'finalizada' AND random() < 0.7 THEN
      tec := 1;
    ELSE
      SELECT t.id INTO tec FROM tecnico t WHERE t.estado = 'activo' ORDER BY random() LIMIT 1;
    END IF;
    SELECT * INTO franja FROM disponibilidad
     WHERE tecnico_id = tec AND estado = 'disponible'
       AND fecha >= CASE WHEN estado_ord = 'finalizada' THEN (fecha_cot + interval '3 days')::date
                         ELSE greatest((fecha_cot + interval '3 days')::date, current_date + 1) END
     ORDER BY fecha, hora_inicio LIMIT 1;

    IF franja.id IS NOT NULL THEN
      visita := franja.fecha + franja.hora_inicio;
      UPDATE disponibilidad SET estado = 'ocupada' WHERE id = franja.id;
      INSERT INTO agendamiento (orden_id, tecnico_id, fecha_programada, estado, notas, disponibilidad_id, fecha_inicio, fecha_fin)
      VALUES (ord_id, tec, visita,
              CASE WHEN estado_ord = 'finalizada' THEN 'cumplida' ELSE 'pendiente' END,
              CASE WHEN estado_ord = 'finalizada' THEN 'Visita realizada sin novedad.' END,
              franja.id,
              CASE WHEN estado_ord = 'finalizada' THEN visita + interval '10 minutes' END,
              CASE WHEN estado_ord = 'finalizada' THEN visita + interval '1 hour 40 minutes' END);
    END IF;

    INSERT INTO historial_orden (orden_id, estado_anterior, estado_nuevo, descripcion, usuario_id, fecha)
    VALUES (ord_id, 'esperando_anticipo', 'en_proceso', 'Anticipo recibido: la orden pasa a ejecución', 1,
            fecha_cot + interval '2 days 1 hour');

    CONTINUE WHEN estado_ord = 'en_proceso' AND (visita IS NULL OR visita > now());

    -- ------------------------------------- reporte técnico (móvil)
    k := 1 + floor(random() * array_length(hallazgos, 1))::int;
    INSERT INTO diagnostico (orden_id, tecnico_id, hallazgos, solucion_aplicada, fecha_diagnostico, fecha_solucion)
    VALUES (ord_id, tec, hallazgos[k],
            CASE WHEN estado_ord = 'finalizada' THEN soluciones[k] END,
            coalesce(visita, fecha_cot + interval '3 days') + interval '30 minutes',
            CASE WHEN estado_ord = 'finalizada' THEN coalesce(visita, fecha_cot + interval '3 days') + interval '1 hour 30 minutes' END);

    INSERT INTO material_orden (orden_id, tecnico_id, descripcion, cantidad, fecha_registro)
    SELECT ord_id, tec, m, 1 + floor(random() * 3)::int,
           coalesce(visita, fecha_cot + interval '3 days') + interval '1 hour'
      FROM unnest(materiales) m WHERE random() < 0.25;

    CONTINUE WHEN estado_ord <> 'finalizada';

    INSERT INTO historial_orden (orden_id, estado_anterior, estado_nuevo, descripcion, usuario_id, fecha)
    VALUES (ord_id, 'en_proceso', 'finalizada', 'Visita finalizada por el técnico', NULL,
            coalesce(visita, fecha_cot + interval '3 days') + interval '1 hour 40 minutes');

    -- Saldo: casi todas quedan pagadas; unas pocas quedan en cartera
    IF random() < 0.85 THEN
      metodo := metodos[1 + floor(random() * 5)::int];
      INSERT INTO abonos (venta_id, monto, tipo_abono, metodo_pago, referencia, fecha_abono)
      VALUES (venta_id_, total - anticipo, 'saldo', metodo,
              CASE WHEN metodo <> 'Efectivo' THEN 'REF-' || lpad((100000 + floor(random() * 899999))::text, 6, '0') END,
              least(coalesce(visita, fecha_cot + interval '3 days') + interval '1 day', now()));
    END IF;
  END LOOP;
END $$;

-- --------------------------------------------- recotización por repuesto
-- Una orden en ejecución quedó esperando la respuesta del cliente a la
-- cotización de un repuesto que pidió el técnico desde el móvil (Móvil HU_11).
DO $$
DECLARE
  ord int;
  cli int;
  cot int;
BEGIN
  SELECT o.id, oc.cliente_id INTO ord, cli
    FROM orden o JOIN v_orden_cliente oc ON oc.orden_id = o.id
   WHERE o.estado = 'en_proceso'
   ORDER BY o.fecha_creacion DESC LIMIT 1;
  IF ord IS NULL THEN RETURN; END IF;

  INSERT INTO cotizacion (cliente_id, fecha_cotizacion, estado, origen, descripcion, orden_id, fecha_envio)
  VALUES (cli, now() - interval '20 hours', 'pendiente', 'tecnico',
          'Recotización solicitada por el técnico: el equipo necesita un repuesto.', ord,
          now() - interval '18 hours')
  RETURNING id INTO cot;
  INSERT INTO detalle_cotizacion (cotizacion_id, servicio_id, cantidad, precio_unitario, tipo_item, descripcion)
  VALUES (cot, NULL, 1, 210000, 'repuesto', 'Disco sólido 480 GB');

  UPDATE orden SET estado = 'en_espera_repuesto' WHERE id = ord;
  INSERT INTO historial_orden (orden_id, estado_anterior, estado_nuevo, descripcion, usuario_id, fecha)
  VALUES (ord, 'en_proceso', 'en_espera_repuesto', 'El técnico solicitó recotización por repuesto (cotización #' || cot || ')', 3,
          now() - interval '20 hours');
END $$;

-- --------------------------------------------- agenda del técnico de la app
-- Julián Mora (jmora) es la cuenta de prueba de la aplicación móvil: se le
-- agendan las órdenes en proceso que aún no tienen visita, en sus próximas
-- franjas libres, para que la app muestre trabajo asignado (Móvil HU_03).
DO $$
DECLARE
  o record;
  fr record;
BEGIN
  FOR o IN
    SELECT id FROM orden
     WHERE estado IN ('en_proceso', 'en_espera_repuesto')
       AND NOT EXISTS (SELECT 1 FROM agendamiento a WHERE a.orden_id = orden.id AND a.estado = 'pendiente')
     ORDER BY fecha_creacion DESC LIMIT 3
  LOOP
    SELECT * INTO fr FROM disponibilidad
     WHERE tecnico_id = 1 AND estado = 'disponible' AND fecha + hora_inicio > now() + interval '2 hours'
     ORDER BY fecha, hora_inicio LIMIT 1;
    EXIT WHEN fr IS NULL;
    UPDATE disponibilidad SET estado = 'ocupada' WHERE id = fr.id;
    INSERT INTO agendamiento (orden_id, tecnico_id, fecha_programada, estado, notas, disponibilidad_id)
    VALUES (o.id, 1, fr.fecha + fr.hora_inicio, 'pendiente', 'Llevar kit de diagnóstico.', fr.id);
    INSERT INTO historial_orden (orden_id, descripcion, usuario_id, fecha)
    VALUES (o.id, 'Visita agendada con Julián Mora', 1, now() - interval '1 hour');
  END LOOP;
END $$;

ALTER TABLE orden ENABLE TRIGGER tg_historial_orden;

-- ------------------------------------------------------- notificaciones
INSERT INTO notificacion (usuario_id, titulo, mensaje, enlace, leida, fecha)
SELECT 1, 'Nueva solicitud de cotización',
       'El cliente ' || cl.nombres || ' ' || cl.apellidos || ' solicitó servicios desde el portal.',
       '/cotizaciones/' || c.id, false, c.fecha_cotizacion
  FROM cotizacion c JOIN cliente cl ON cl.id = c.cliente_id
 WHERE c.estado = 'solicitada' AND c.origen = 'cliente';

INSERT INTO notificacion (usuario_id, titulo, mensaje, enlace, leida, fecha)
SELECT u.id, 'Cotización por revisar', 'Tienes la cotización #' || c.id || ' esperando tu decisión.',
       '/portal/cotizaciones/' || c.id, false, c.fecha_envio
  FROM cotizacion c JOIN cliente cl ON cl.id = c.cliente_id JOIN usuario u ON u.id = cl.usuario_id
 WHERE c.estado = 'pendiente';

-- ------------------------------------------------------ registro de accesos
INSERT INTO registro_acceso (usuario_id, identificador, resultado, canal, ip, fecha)
SELECT u.id, u.correo,
       CASE WHEN random() < 0.1 THEN 'fallido' ELSE 'exitoso' END,
       CASE WHEN u.rol_id = 3 THEN 'movil' ELSE 'web' END,
       '181.49.' || floor(random() * 255)::int || '.' || floor(random() * 255)::int,
       now() - make_interval(hours => floor(random() * 24 * 30)::int)
  FROM usuario u CROSS JOIN generate_series(1, 6)
 WHERE u.estado = 'activo';

INSERT INTO registro_acceso (usuario_id, identificador, resultado, canal, ip, fecha) VALUES
  (NULL, 'admin@rvrtec.co',     'fallido',   'web', '190.85.12.44', now() - interval '3 days 2 hours'),
  (NULL, 'admin@rvrtec.co',     'fallido',   'web', '190.85.12.44', now() - interval '3 days 2 hours' + interval '20 seconds'),
  (NULL, 'admin@rvrtec.co',     'fallido',   'web', '190.85.12.44', now() - interval '3 days 2 hours' + interval '41 seconds'),
  (NULL, 'admin@rvrtec.co',     'bloqueado', 'web', '190.85.12.44', now() - interval '3 days 2 hours' + interval '41 seconds');

COMMIT;

-- Resumen de lo cargado
SELECT 'clientes' AS tabla, count(*) FROM cliente
UNION ALL SELECT 'técnicos', count(*) FROM tecnico
UNION ALL SELECT 'franjas', count(*) FROM disponibilidad
UNION ALL SELECT 'cotizaciones', count(*) FROM cotizacion
UNION ALL SELECT 'órdenes', count(*) FROM orden
UNION ALL SELECT 'ventas', count(*) FROM ventas
UNION ALL SELECT 'abonos', count(*) FROM abonos
UNION ALL SELECT 'visitas', count(*) FROM agendamiento;
