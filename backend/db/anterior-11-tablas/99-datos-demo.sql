-- ============================================================================
--  Portal RvR Tecnologías · Datos de demostración  (OPCIONAL)
--
--  NO es carga de producción. Sirve para dos cosas:
--    1. Que los KPIs de `03-kpis.sql` devuelvan cifras y no ceros.
--    2. Tener algo que mostrar en la sustentación.
--
--  Genera 10 clientes, 4 técnicos y 80 órdenes repartidas en los últimos 60
--  días entre los ocho estados, con sus agendamientos, ventas y abonos.
--  Es determinista: sin `random()`, todo sale de aritmética sobre el número de
--  fila, así que dos personas que lo corran obtienen exactamente lo mismo.
--
--  Ejecutar DESPUÉS de 01-esquema.sql y 02-catalogos.sql.
--  Para volver a empezar:  TRUNCATE abonos, ventas, diagnosticos,
--    ordenes_servicio, agendamientos RESTART IDENTITY CASCADE;
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------- clientes (rol 6)

INSERT INTO usuarios (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
VALUES
  (6, 'clinica.americas', 'compras@lasamericas.co',   'demo-no-usar', 'Clínica Las',      'Américas',    '3041112233', 'activo'),
  (6, 'ferreteria.yunque','compras@elyunque.co',      'demo-no-usar', 'Ferretería El',    'Yunque',      '3042223344', 'activo'),
  (6, 'panaderia.espiga', 'info@laespiga.co',         'demo-no-usar', 'Panadería La',     'Espiga',      '3043334455', 'activo'),
  (6, 'colegio.ignacio',  'sistemas@sanignacio.edu.co','demo-no-usar','Colegio San',      'Ignacio',     '3044445566', 'activo'),
  (6, 'transportes.cafe', 'ti@transportescafe.co',    'demo-no-usar', 'Transportes del',  'Café',        '3045556677', 'activo'),
  (6, 'hotel.poblado',    'mantenimiento@hpoblado.co','demo-no-usar', 'Hotel El',         'Poblado',     '3046667788', 'activo'),
  (6, 'distri.antioquia', 'compras@distriant.co',     'demo-no-usar', 'Distribuidora',    'Antioquia',   '3047778899', 'activo'),
  (6, 'taller.morales',   'contacto@tallermorales.co','demo-no-usar', 'Taller',           'Morales',     '3048889900', 'activo'),
  (6, 'consultorio.sanz', 'citas@consultoriosanz.co', 'demo-no-usar', 'Consultorio',      'Sanz',        '3049990011', 'activo'),
  (6, 'bodega.sur',       'logistica@bodegasur.co',   'demo-no-usar', 'Bodega',           'Sur',         '3040001122', 'activo');

-- ------------------------------------------------------------ técnicos (rol 3)
-- julian.mora ya existe en 02-catalogos.sql; aquí entran tres más.

INSERT INTO usuarios (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
VALUES
  (3, 'andres.quintero', 'andres.quintero@rvrtec.co', 'demo-no-usar', 'Andrés',  'Quintero', '3011112233', 'activo'),
  (3, 'marcela.rios',    'marcela.rios@rvrtec.co',    'demo-no-usar', 'Marcela', 'Ríos',     '3012223344', 'activo'),
  (3, 'felipe.ocampo',   'felipe.ocampo@rvrtec.co',   'demo-no-usar', 'Felipe',  'Ocampo',   '3013334455', 'activo');

-- ----------------------------------------------------------------- órdenes
-- 80 órdenes en los últimos 60 días. El estado, el cliente, el técnico y el
-- servicio salen del número de fila por módulo: reparto estable y variado.

WITH numeros AS (
  SELECT generate_series(1, 80) AS n
),
clientes AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS pos
    FROM usuarios WHERE rol_id = 6
),
tecnicos AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS pos
    FROM usuarios WHERE rol_id = 3
),
servicios_activos AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS pos
    FROM servicios WHERE coalesce(estado, 'activo') = 'activo'
),
plan AS (
  SELECT
    n,
    -- 8 estados con pesos distintos: se repite la lista para que completada y
    -- pendiente pesen más que cancelada, como en la operación real.
    (ARRAY['completada','completada','completada','completada','completada',
           'pendiente','pendiente','pendiente',
           'en_proceso','en_proceso','en_proceso',
           'programada','programada',
           'aprobada','aprobada',
           'nueva','nueva',
           'reprogramada',
           'cancelada'])[1 + (n * 7) % 19]                       AS estado,
    -- 17 y 60 son primos entre sí, así que `(n * 17) % 60` recorre los 60 días
    -- sin repetir antes de agotarlos: las órdenes quedan repartidas y no en
    -- grupos cada tres días.
    (current_date - ((n * 17) % 60) * interval '1 day'
      + ((n % 9) + 7) * interval '1 hour')                       AS ingreso,
    (n % 10)                                                     AS cli_pos,
    (n % 4)                                                      AS tec_pos,
    (n % 14)                                                     AS srv_pos
  FROM numeros
)
INSERT INTO ordenes_servicio
  (cliente_id, tecnico_id, servicio_id, estado, descripcion_problema, fecha_ingreso, fecha_entrega)
SELECT
  c.id,
  -- Las nuevas y pendientes todavía no tienen técnico asignado.
  CASE WHEN p.estado IN ('nueva', 'pendiente') THEN NULL ELSE t.id END,
  s.id,
  p.estado,
  (ARRAY[
    'El equipo no enciende después del corte de energía',
    'La red se cae de forma intermitente en la sede',
    'Las cámaras no están grabando desde el fin de semana',
    'El servidor va muy lento y se reinicia solo',
    'La impresora imprime con rayas y atasca el papel',
    'No hay señal en tres puntos de red de la oficina',
    'La alarma se activa sola de madrugada',
    'Necesitamos respaldo de la información antes del cambio de equipos'
  ])[1 + (p.n * 5) % 8],
  p.ingreso,
  CASE WHEN p.estado = 'completada'
       THEN p.ingreso + ((p.n % 5) + 1) * interval '1 day'
       ELSE NULL END
FROM plan p
JOIN clientes c          ON c.pos = p.cli_pos
JOIN tecnicos t          ON t.pos = p.tec_pos
JOIN servicios_activos s ON s.pos = p.srv_pos;

-- ------------------------------------------------------------ agendamientos
-- Las órdenes programadas y reprogramadas reciben su visita; además se siembran
-- visitas en los próximos 7 días para que la agenda de la semana tenga barras.

INSERT INTO agendamientos
  (cliente_id, tecnico_id, servicio_id, fecha_programada, estado, notas)
SELECT o.cliente_id, o.tecnico_id, o.servicio_id,
       o.fecha_ingreso + ((o.id % 6) + 1) * interval '1 day' + interval '8 hours',
       CASE WHEN o.estado = 'reprogramada' THEN 'reprogramado' ELSE 'programado' END,
       'Visita generada con los datos de demostración'
  FROM ordenes_servicio o
 WHERE o.estado IN ('programada', 'reprogramada', 'en_proceso');

INSERT INTO agendamientos
  (cliente_id, tecnico_id, servicio_id, fecha_programada, estado, notas)
SELECT o.cliente_id, o.tecnico_id, o.servicio_id,
       current_date + ((o.id % 7)) * interval '1 day'
         + (8 + (o.id % 6)) * interval '1 hour',
       'programado',
       'Visita de la semana en curso'
  FROM ordenes_servicio o
 WHERE o.estado IN ('aprobada', 'programada')
 LIMIT 18;

-- Cada orden agendada queda ligada a su visita más cercana.
UPDATE ordenes_servicio o
   SET agendamiento_id = a.id
  FROM agendamientos a
 WHERE a.cliente_id = o.cliente_id
   AND a.servicio_id = o.servicio_id
   AND o.agendamiento_id IS NULL
   AND o.estado IN ('programada', 'reprogramada', 'en_proceso');

-- ------------------------------------------------------------- diagnósticos
-- Solo las órdenes que ya recibieron visita.

INSERT INTO diagnosticos (orden_id, tecnico_id, hallazgos, solucion_propuesta, fecha_diagnostico)
SELECT o.id, o.tecnico_id,
       (ARRAY[
         'Fuente de poder averiada por sobretensión',
         'Switch saturado y cableado sin certificar en dos puntos',
         'Disco del grabador lleno, sin rotación de grabaciones',
         'Memoria RAM defectuosa en el banco 2',
         'Rodillo de arrastre desgastado'
       ])[1 + (o.id * 3) % 5],
       (ARRAY[
         'Cambio de fuente y instalación de UPS',
         'Reemplazo del switch y certificación de los puntos',
         'Cambio de disco y configuración de rotación',
         'Cambio del módulo de memoria',
         'Cambio del rodillo y mantenimiento general'
       ])[1 + (o.id * 3) % 5],
       o.fecha_ingreso + interval '1 day'
  FROM ordenes_servicio o
 WHERE o.estado IN ('en_proceso', 'completada');

-- -------------------------------------------------------------------- ventas
-- Se factura lo completado y lo que está en proceso.

INSERT INTO ventas (orden_id, cliente_id, monto_total, saldo_pendiente, estado_pago, fecha_venta)
SELECT o.id, o.cliente_id, s.precio, s.precio, 'pendiente',
       coalesce(o.fecha_entrega, o.fecha_ingreso + interval '2 days')
  FROM ordenes_servicio o
  JOIN servicios s ON s.id = o.servicio_id
 WHERE o.estado IN ('completada', 'en_proceso');

-- -------------------------------------------------------------------- abonos
-- Anticipo del 50 % en todas, y el saldo solo en las completadas.

INSERT INTO abonos (venta_id, monto, metodo_pago, referencia, fecha_abono)
SELECT v.id, round(v.monto_total * 0.5, 2),
       (ARRAY['Transferencia','Efectivo','Tarjeta','Nequi'])[1 + (v.id % 4)],
       'ANT-' || lpad(v.id::text, 5, '0'),
       v.fecha_venta - interval '1 day'
  FROM ventas v;

INSERT INTO abonos (venta_id, monto, metodo_pago, referencia, fecha_abono)
SELECT v.id, v.monto_total - round(v.monto_total * 0.5, 2),
       (ARRAY['Transferencia','Efectivo','Tarjeta','Nequi'])[1 + ((v.id + 2) % 4)],
       'SAL-' || lpad(v.id::text, 5, '0'),
       v.fecha_venta
  FROM ventas v
  JOIN ordenes_servicio o ON o.id = v.orden_id
 WHERE o.estado = 'completada'
   -- Una de cada cinco completadas queda con saldo, para que la cartera no dé 100 %.
   AND (v.id % 5) <> 0;

-- El saldo y el estado de cada venta se ponen al día con lo realmente abonado.
UPDATE ventas v
   SET saldo_pendiente = v.monto_total - x.abonado,
       estado_pago = CASE
         WHEN x.abonado >= v.monto_total THEN 'pagado'
         WHEN x.abonado > 0             THEN 'parcial'
         ELSE 'pendiente' END
  FROM (SELECT venta_id, sum(monto) AS abonado FROM abonos GROUP BY venta_id) x
 WHERE x.venta_id = v.id;

COMMIT;
