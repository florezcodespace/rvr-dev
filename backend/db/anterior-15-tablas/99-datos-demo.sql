-- ============================================================================
--  Portal RvR Tecnologías · Datos de demostración  (OPCIONAL)
--
--  NO es carga de producción. Sirve para dos cosas:
--    1. Que los KPIs de `03-kpis.sql` devuelvan cifras y no ceros.
--    2. Tener algo que mostrar en la sustentación.
--
--  Genera 10 clientes, 3 técnicos más y 80 órdenes repartidas en los últimos 60
--  días entre los ocho estados, con uno a tres servicios cada una, sus
--  agendamientos, diagnósticos, ventas y abonos.
--  Es determinista: sin `random()`, todo sale de aritmética sobre el número de
--  fila, así que dos personas que lo corran obtienen exactamente lo mismo.
--
--  Ejecutar DESPUÉS de 01-esquema.sql y 02-catalogos.sql.
--  Para volver a empezar, correr otra vez 01-esquema.sql y 02-catalogos.sql.
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------ clientes
-- Sin cuenta en el portal: es el caso real de RvR, donde el cliente llega por
-- WhatsApp o por teléfono. `usuario_id` queda nulo.

INSERT INTO clientes
  (tipo_documento, numero_documento, nombre, correo, telefono, direccion, ciudad, sector)
VALUES
  ('NIT', '890905177-1', 'Clínica Las Américas',   'compras@lasamericas.co',     '3041112233', 'Diagonal 75B # 2A-80',        'Medellín', 'Salud'),
  ('NIT', '900412008-6', 'Ferretería El Yunque',   'compras@elyunque.co',        '3042223344', 'Carrera 50 # 37-40',          'Itagüí',   'Retail'),
  ('CC',  '43118902',    'Panadería La Espiga',    'info@laespiga.co',           '3043334455', 'Calle 5 Sur # 25-12',         'Sabaneta', 'Alimentos'),
  ('NIT', '890980116-2', 'Colegio San Ignacio',    'sistemas@sanignacio.edu.co', '3044445566', 'Carrera 44 # 48-34',          'Medellín', 'Educación'),
  ('NIT', '901334771-0', 'Transportes del Café',   'ti@transportescafe.co',      '3045556677', 'Carrera 48 # 26 Sur-181',     'Envigado', 'Logística'),
  ('NIT', '811020334-9', 'Hotel El Poblado',       'mantenimiento@hpoblado.co',  '3046667788', 'Calle 10 # 43-12',            'Medellín', 'Hotelería'),
  ('NIT', '900771245-3', 'Distribuidora Antioquia','compras@distriant.co',       '3047778899', 'Diagonal 64E # 67-180',       'Bello',    'Retail'),
  ('CC',  '71654320',    'Taller Morales',         'contacto@tallermorales.co',  '3048889900', 'Calle 30 # 65-15',            'Medellín', 'Servicios'),
  ('CC',  '1036654987',  'Consultorio Sanz',       'citas@consultoriosanz.co',   '3049990011', 'Carrera 70 # 44-21',          'Medellín', 'Salud'),
  ('NIT', '901554302-8', 'Bodega Sur',             'logistica@bodegasur.co',     '3040001122', 'Calle 50 # 51-30',            'Itagüí',   'Logística');

-- ------------------------------------------------------------------ técnicos
-- julian.mora ya existe en 02-catalogos.sql; aquí entran tres más, cada uno
-- con su cuenta (rol 3) y su ficha de técnico.

WITH cuentas AS (
  INSERT INTO usuarios (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
  VALUES
    (3, 'andres.quintero', 'andres.quintero@rvrtec.co', 'demo-no-usar', 'Andrés',  'Quintero', '3011112233', 'activo'),
    (3, 'marcela.rios',    'marcela.rios@rvrtec.co',    'demo-no-usar', 'Marcela', 'Ríos',     '3012223344', 'activo'),
    (3, 'felipe.ocampo',   'felipe.ocampo@rvrtec.co',   'demo-no-usar', 'Felipe',  'Ocampo',   '3013334455', 'activo')
  RETURNING id, nombre_usuario
)
INSERT INTO tecnicos (usuario_id, especialidad, zona, estado)
SELECT c.id, t.especialidad, t.zona, t.estado::estado_tecnico
  FROM cuentas c
  JOIN (VALUES
    ('andres.quintero', 'Redes y cableado estructurado', 'Envigado', 'en_ruta'),
    ('marcela.rios',    'CCTV y seguridad electrónica',  'Itagüí',   'en_sitio'),
    ('felipe.ocampo',   'Servidores y respaldo de datos','Bello',    'disponible')
  ) AS t (usuario, especialidad, zona, estado) ON t.usuario = c.nombre_usuario;

-- ----------------------------------------------------------------- órdenes
-- 80 órdenes en los últimos 60 días. El estado, el cliente y el técnico salen
-- del número de fila por módulo: reparto estable y variado.

WITH numeros AS (
  SELECT generate_series(1, 80) AS n
),
clientes AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS pos
    FROM clientes
),
tecnicos AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS pos
    FROM tecnicos
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
           'cancelada'])[1 + (n * 7) % 19]::estado_orden            AS estado,
    -- 17 y 60 son primos entre sí, así que `(n * 17) % 60` recorre los 60 días
    -- sin repetir antes de agotarlos: las órdenes quedan repartidas y no en
    -- grupos cada tres días.
    -- `least(..., now())`: ninguna orden entra en el futuro.
    least(current_date - ((n * 17) % 60) * interval '1 day'
            + ((n % 9) + 7) * interval '1 hour',
          now() - interval '1 hour')                                AS ingreso,
    (n % 10)                                                        AS cli_pos,
    (n % 4)                                                         AS tec_pos
  FROM numeros
)
INSERT INTO ordenes_servicio
  (id, cliente_id, tecnico_id, estado, descripcion_problema, direccion_servicio,
   fecha_ingreso, fecha_entrega)
SELECT
  p.n,
  c.id,
  -- Las nuevas y pendientes todavía no tienen técnico asignado.
  CASE WHEN p.estado IN ('nueva', 'pendiente') THEN NULL ELSE t.id END,
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
  (ARRAY[
    'Calle 10 # 43-12, El Poblado, Medellín',
    'Carrera 70 # 44-21, Laureles, Medellín',
    'Calle 50 # 51-30, La Candelaria, Medellín',
    'Carrera 48 # 26 Sur-181, Envigado',
    'Calle 30 # 65-15, Belén, Medellín',
    'Carrera 50 # 37-40, Itagüí',
    'Diagonal 64E # 67-180, Bello',
    'Calle 5 Sur # 25-12, Sabaneta'
  ])[1 + (p.n % 8)],
  p.ingreso,
  CASE WHEN p.estado = 'completada'
       THEN least(p.ingreso + ((p.n % 5) + 1) * interval '1 day', now())
       ELSE NULL END
FROM plan p
JOIN clientes c ON c.pos = p.cli_pos
JOIN tecnicos t ON t.pos = p.tec_pos;

-- Los ids se pusieron a mano (1 a 80): la secuencia sigue desde el 81.
DO $$ BEGIN
  PERFORM setval(pg_get_serial_sequence('ordenes_servicio', 'id'),
                 (SELECT max(id) FROM ordenes_servicio));
END $$;

-- ------------------------------------------------------------ detalle
-- Cada orden lleva de uno a tres servicios. El precio y la garantía se copian
-- del catálogo, que es exactamente lo que hará el portal al crear la orden.
-- La lista `demanda` repite los servicios más comunes (mantenimiento,
-- formateo, puntos de red, cámaras) para que el ranking no salga plano.

INSERT INTO orden_servicio_detalle
  (orden_id, servicio_id, cantidad, precio_unitario, dias_garantia)
SELECT o.id, s.id,
       CASE WHEN s.id IN (5, 9) THEN 1 + (o.id % 3) ELSE 1 END,
       s.precio, s.dias_garantia
  FROM ordenes_servicio o
  CROSS JOIN LATERAL generate_series(0, o.id % 3) AS k
  CROSS JOIN LATERAL (
    SELECT ARRAY[1,1,1,1,1,2,2,2,2,3,3,3,4,4,5,5,5,9,9,9,
                 8,8,12,13,10,11,6,7,14] AS demanda
  ) w
  JOIN servicios s
    ON s.id = w.demanda[1 + (o.id * 7 + k * 11) % array_length(w.demanda, 1)]
-- Si dos vueltas caen en el mismo servicio, queda una sola línea.
ON CONFLICT (orden_id, servicio_id) DO NOTHING;

-- ------------------------------------------------------------ agendamientos
-- Las órdenes programadas, reprogramadas y en proceso reciben su visita, y las
-- reprogramadas conservan además la visita anterior, cancelada: es el caso
-- que el modelo de 11 tablas no podía guardar. También se siembran visitas en
-- los próximos 7 días para que la agenda de la semana tenga barras.

INSERT INTO agendamientos (orden_id, tecnico_id, fecha_programada, estado, notas)
SELECT o.id, o.tecnico_id,
       o.fecha_ingreso + ((o.id % 6) + 1) * interval '1 day' + interval '8 hours',
       'cancelado', 'El cliente pidió cambiar la fecha'
  FROM ordenes_servicio o
 WHERE o.estado = 'reprogramada';

INSERT INTO agendamientos (orden_id, tecnico_id, fecha_programada, estado, notas)
SELECT o.id, o.tecnico_id,
       o.fecha_ingreso + ((o.id % 6) + 3) * interval '1 day' + interval '9 hours',
       CASE o.estado
         WHEN 'reprogramada' THEN 'reprogramado'
         WHEN 'en_proceso'   THEN 'en_curso'
         ELSE                     'programado' END::estado_agenda,
       'Visita generada con los datos de demostración'
  FROM ordenes_servicio o
 WHERE o.estado IN ('programada', 'reprogramada', 'en_proceso');

INSERT INTO agendamientos (orden_id, tecnico_id, fecha_programada, estado, notas)
SELECT o.id, o.tecnico_id,
       current_date + (o.id % 7) * interval '1 day'
         + (8 + (o.id % 6)) * interval '1 hour',
       'programado', 'Visita de la semana en curso'
  FROM ordenes_servicio o
 WHERE o.estado IN ('aprobada', 'programada')
 ORDER BY o.id
 LIMIT 18;

-- Las completadas tuvieron su visita, ya cumplida.
INSERT INTO agendamientos (orden_id, tecnico_id, fecha_programada, estado, notas)
SELECT o.id, o.tecnico_id,
       least(o.fecha_ingreso + interval '1 day', o.fecha_entrega),
       'completado', 'Visita realizada'
  FROM ordenes_servicio o
 WHERE o.estado = 'completada';

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
-- Se factura lo completado y lo que está en proceso. El total es la suma del
-- detalle de la orden.

INSERT INTO ventas (orden_id, monto_total, fecha_venta)
SELECT o.id, d.total,
       coalesce(o.fecha_entrega, o.fecha_ingreso + interval '2 days')
  FROM ordenes_servicio o
  JOIN LATERAL (
    SELECT sum(subtotal) AS total
      FROM orden_servicio_detalle WHERE orden_id = o.id
  ) d ON true
 WHERE o.estado IN ('completada', 'en_proceso');

-- -------------------------------------------------------------------- abonos
-- Anticipo del 50 % en todas, y el saldo solo en las completadas. Los medios
-- de pago son los ids 1 a 4 del catálogo.

INSERT INTO abonos (venta_id, metodo_pago_id, tipo_pago, monto, estado, referencia, fecha_abono)
SELECT v.id, 1 + (v.id % 4), 'anticipo', round(v.monto_total * 0.5, 2),
       'conciliado', 'ANT-' || lpad(v.id::text, 5, '0'),
       v.fecha_venta - interval '1 day'
  FROM ventas v;

INSERT INTO abonos (venta_id, metodo_pago_id, tipo_pago, monto, estado, referencia, fecha_abono)
SELECT v.id, 1 + ((v.id + 2) % 4), 'saldo', v.monto_total - round(v.monto_total * 0.5, 2),
       -- Los saldos de la última semana siguen por conciliar.
       CASE WHEN v.fecha_venta > now() - interval '7 days'
            THEN 'por_conciliar' ELSE 'conciliado' END::estado_abono,
       'SAL-' || lpad(v.id::text, 5, '0'),
       v.fecha_venta
  FROM ventas v
  JOIN ordenes_servicio o ON o.id = v.orden_id
 WHERE o.estado = 'completada'
   -- Una de cada cinco completadas queda con saldo, para que la cartera no dé 100 %.
   AND (v.id % 5) <> 0;

-- Ya no hay UPDATE de saldo ni de estado de pago: los calcula la vista v_ventas.

COMMIT;
