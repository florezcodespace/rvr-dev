# Base de datos — PostgreSQL · modelo corregido (15 tablas)

El motor del proyecto es **PostgreSQL**. Esta carpeta tiene lo necesario para
dejar la base montada y cargada en unos minutos.

| Archivo | Qué hace | Cuándo se corre |
|---|---|---|
| `modelo.dbml` | **El modelo oficial.** Se pega en dbdiagram.io para ver el diagrama | Es la referencia, no se ejecuta |
| `01-esquema.sql` | Crea las 15 tablas, las listas de estados, las reglas y la vista `v_ventas` | Una vez, al crear la base |
| `montar.ps1` | Lo usa `montar-base.bat` (en la raíz): crea la base, la carga y configura los `.env` | Cuando quieras montar o reiniciar |
| `02-catalogos.sql` | Carga roles, permisos, categorías, servicios, medios de pago y las cuentas de acceso | Una vez, al crear la base |
| `03-kpis.sql` | Las 14 consultas de los KPIs. **No modifica nada**, son todas `SELECT` | Cuando quieras consultar |
| `99-datos-demo.sql` | **Opcional.** 80 órdenes de demostración para que los KPIs no salgan en cero | Solo en la base de pruebas |
| `anterior-11-tablas/` | El modelo de 11 tablas tal como estaba antes de corregirlo | Solo de consulta |

> ⚠️ `01-esquema.sql` empieza borrando las tablas (`DROP … CASCADE`), tanto las
> del modelo de 11 tablas como las de este. Sirve para crear la base desde cero
> o para pasar de la versión anterior a esta, **nunca** sobre una base con
> datos reales.

> ⚠️ `99-datos-demo.sql` es para la base de **pruebas o de sustentación**, nunca
> para la de producción: mete 80 órdenes inventadas.

## Montarla en tu PostgreSQL de Windows

**La forma fácil:** doble clic en **`montar-base.bat`**, en la raíz del proyecto.

1. Busca tu PostgreSQL y te pide la contraseña del usuario `postgres`.
2. Borra la base `rvr` si existe y la crea de nuevo (pide escribir `SI`).
3. Carga el esquema y los catálogos, y pregunta si quieres los datos de
   demostración.
4. Escribe `api/.env` (conexión a la base) y `.env` (el portal usa la API).
5. Instala las dependencias de la API si faltan.

Después, **`iniciar.bat`** levanta la API en una ventana aparte y el portal en
`http://localhost:5173`, ya trabajando contra PostgreSQL. Para volver a los
datos de prueba basta con borrar el archivo `.env` de la raíz.

Si tu PostgreSQL no usa el puerto 5432, antes de ejecutarlo abre una consola en
la carpeta y escribe `set RVR_PG_PUERTO=5433` (el que sea) y luego
`montar-base.bat`.

**A mano, desde SQL Shell (psql):**

```sql
DROP DATABASE IF EXISTS rvr WITH (FORCE);
CREATE DATABASE rvr ENCODING 'UTF8' TEMPLATE template0;
\c rvr
\encoding UTF8
\i 'C:/Users/ANDRES/Desktop/DEV/5TO TRIMESTRE/RVR DEV/db/01-esquema.sql'
\i 'C:/Users/ANDRES/Desktop/DEV/5TO TRIMESTRE/RVR DEV/db/02-catalogos.sql'
\i 'C:/Users/ANDRES/Desktop/DEV/5TO TRIMESTRE/RVR DEV/db/99-datos-demo.sql'
```

Las rutas van con `/` y no con `\`, y entre comillas simples por los espacios
de la carpeta. La última línea es opcional (datos de demostración). Por este
camino los `.env` hay que escribirlos a mano (ver `api/.env.example`).

Para comprobar que quedó bien:

```sql
\dt                                   -- 15 tablas
\dT                                   -- 10 listas de estados
SELECT count(*) FROM ordenes_servicio; -- 80 si cargaste la demo, 0 si no
SELECT * FROM v_ventas LIMIT 5;        -- saldo y estado de pago calculados
```

**En la nube (Neon o Supabase):** los mismos tres archivos, en el mismo orden,
pegados en el **SQL Editor** del panel.

---

## Qué se corrigió respecto al modelo de 11 tablas

Son las correcciones de la revisión del 18 de septiembre
(`claude/revision-bd-v2-septiembre.md` en el proyecto). Las tablas pasan de 11 a
15: entran `clientes`, `tecnicos`, `orden_servicio_detalle` y `metodos_pago`.

| # | Problema en el de 11 tablas | Cómo quedó |
|---|---|---|
| 1 | Una orden solo podía tener **un** servicio | Nueva `orden_servicio_detalle`: una orden, varios servicios |
| 2 | El valor de las órdenes viejas cambiaba si subía el precio del catálogo | El detalle **copia** `precio_unitario` al crear la línea |
| 3 | No había garantía | `servicios.dias_garantia`, copiado también al detalle |
| 4 | Estados en `varchar` sin validar (`Completada` ≠ `completada`) | 8 listas cerradas (`ENUM`): la base rechaza lo que no esté en la lista |
| 5 | Clientes y técnicos eran filas de `usuarios`: todo cliente necesitaba cuenta y se podía poner un técnico como cliente | Tablas `clientes` (cuenta opcional, con documento, dirección, ciudad y sector) y `tecnicos` (siempre con cuenta, con especialidad, zona y estado). La regla `exigir_rol` valida que la cuenta tenga el rol que corresponde |
| 6 | La orden colgaba del agendamiento (agendar antes de cotizar) | Al revés: `agendamientos.orden_id`. Una orden, varias visitas, y la reprogramada no borra la anterior |
| 7 | Cliente, técnico y servicio repetidos en orden y agendamiento | El agendamiento solo guarda lo suyo: técnico, fecha, estado y notas |
| 8 | `saldo_pendiente` guardado, se desincronizaba | Se calcula en la vista `v_ventas`, junto con el estado de pago |
| 9 | Medio de pago como texto libre | Nueva `metodos_pago` y `abonos.metodo_pago_id` |
| 10 | El abono no distinguía anticipo de saldo ni tenía estado | `abonos.tipo_pago` (anticipo/saldo) y `abonos.estado` |
| 13 | La orden no tenía dirección | `ordenes_servicio.direccion_servicio`, obligatoria |
| 14–18 | FKs sin `NOT NULL`, correo sin `UNIQUE`, fechas sin `DEFAULT`, sin índices | Todo corregido; el correo es único sin distinguir mayúsculas |
| 19 | Sin `ultimo_acceso` | `usuarios.ultimo_acceso` |

Además, dos reglas que protegen los datos:

- **Nadie abona de más.** La suma de abonos de una venta no puede pasar del
  total, y una venta anulada no recibe abonos.
- **Una orden completada tiene fecha de entrega**, y esa fecha no puede ser
  anterior a la de ingreso.

**Quedó fuera a propósito** (se agrega cuando se decida, juntos): cotizaciones,
insumos, evidencias fotográficas, horarios y novedades de técnicos, historial de
estados, habilidades del técnico y unidad de cobro del servicio. El
administrador **no** lleva tabla propia: es un usuario con rol `administrador`.

## El modelo y cómo se cambia

`modelo.dbml` es la **fuente de verdad** del modelo: 15 tablas.
`01-esquema.sql` es su traducción a PostgreSQL y los dos se mantienen en
paralelo — si uno cambia, el otro también. Se comprobó columna por columna que
coinciden.

**Ningún cambio a la base entra sin acordarlo primero.** Cuando se acuerde uno:

1. Se actualiza `modelo.dbml` (y el diagrama en dbdiagram.io).
2. Mientras no haya datos reales, se actualiza `01-esquema.sql` y se vuelve a
   montar la base.
3. Cuando ya haya datos reales, el cambio va en un script **nuevo y numerado**
   (`10-…`, `11-…`) con solo el `ALTER` o el `CREATE` de ese cambio.

---

## Cuentas que quedan creadas

| Correo | Contraseña | Rol |
|---|---|---|
| `ricardo.vargas@rvrtec.co` | `RvR2026*admin` | administrador |
| `laura.gomez@rvrtec.co` | `RvR2026*coord` | coordinacion |
| `julian.mora@rvrtec.co` | `RvR2026*tecnico` | tecnico |

Las contraseñas se guardan cifradas con **bcrypt**; en la tabla solo queda el
hash y no hay forma de leerlas de vuelta. Cámbialas antes de cualquier uso real.

## Qué carga y qué no

Se cargan: 6 roles, 22 permisos con sus asignaciones, 4 categorías, 14 servicios
con precio y días de garantía, 5 medios de pago, 3 usuarios y la ficha de técnico
de Julián.

Arrancan **vacías**: `clientes`, `ordenes_servicio`, `orden_servicio_detalle`,
`agendamientos`, `diagnosticos`, `ventas` y `abonos`. Se llenan desde el portal
(o con `99-datos-demo.sql` para pruebas).

## Tipos en PostgreSQL

| Diagrama | PostgreSQL | Por qué |
|---|---|---|
| `int` PK autoincremental | `int GENERATED BY DEFAULT AS IDENTITY` | Estándar SQL; `BY DEFAULT` deja insertar ids fijos en la carga |
| fechas | `timestamptz` | Medellín es UTC−5 y el portal muestra "hace 9 h" |
| `decimal(10,2)` | `numeric(10,2)` | Tipo exacto, sin errores de redondeo con plata |
| estados | `ENUM` | Lista cerrada; el orden de la lista es el orden del flujo |
| `subtotal` | columna generada | `cantidad × precio_unitario`, siempre al día |

---

## Los KPIs

`03-kpis.sql` trae catorce consultas: las cuatro que exige el subproceso de
Reportes de la ficha técnica, las del tablero del portal y dos extra.

| # | KPI | De dónde sale |
|---|---|---|
| A1 | Cantidad de servicios realizados | Ficha técnica |
| A2 | Órdenes por estado | Ficha técnica |
| A3 | Servicios más solicitados | Ficha técnica |
| A4 | Técnicos con mayor número de servicios ejecutados | Ficha técnica |
| B1 | Ingresos del período, contra los 30 días previos | Tablero |
| B2 | Órdenes completadas del período | Tablero |
| B3 | Órdenes activas y sin técnico asignado | Tablero |
| B4 | Cartera recaudada | Tablero |
| B5 | Tendencia de 14 días: creadas contra completadas | Tablero |
| B6 | Pipeline de órdenes agrupado | Tablero |
| B7 | Estado de cartera por cliente | Tablero |
| B8 | Agenda de visitas de los próximos 7 días | Tablero |
| — | Distribución por medio de pago | Extra |
| — | Servicios entregados que siguen en garantía | Extra (nuevo con este modelo) |

### Las mismas consultas, ordenadas por pantalla

`kpis/por-modulo/` trae un archivo por dashboard del portal — `dashboard.sql`,
`ordenes.sql`, `clientes.sql`, `tecnicos.sql`, `servicios.sql`, `pagos.sql`,
`usuarios.sql` y `reportes.sql` — con cada bloque rotulado con la tarjeta o la
gráfica que alimenta, para poner la captura del resultado al lado de la del
portal. `kpis/` guarda además los catorce KPIs sueltos (`A1`, `B5`, `C2`…) por si
se necesita uno solo. El índice está en `kpis/por-modulo/README.md`.

### Cómo correrlas en pgAdmin

Abre el **Query Tool** sobre la base `rvr`, pega **una consulta a la vez** y
pulsa F5. Si pegas el archivo completo, pgAdmin solo muestra el resultado de la
última; seleccionar el bloque y pulsar F5 ejecuta únicamente lo seleccionado.

### Cómo cambiar el período

Las consultas que dependen de un rango abren con un CTE `periodo`. Se cambia
ahí, en un solo sitio:

```sql
WITH periodo AS (
  SELECT current_date - interval '30 days' AS desde,   -- ← cámbialo aquí
         current_date + interval '1 day'   AS hasta
)
```

### Decisiones que conviene poder sustentar

Son las preguntas que probablemente te hagan:

- **A1 cuenta por `fecha_entrega`, no por `fecha_ingreso`.** Una orden que entró
  en agosto y se cerró en septiembre es un servicio realizado en septiembre.
- **A4 usa `LEFT JOIN`.** Un técnico sin órdenes en el período tiene que salir
  con cero; con un `JOIN` normal desaparecería del reporte de carga, que es
  justo lo que no se quiere.
- **B1 mide lo abonado, no lo facturado.** Una venta emitida y sin cobrar no es
  plata que entró.
- **B4 usa `LEFT JOIN LATERAL`.** Con un `JOIN` normal a `abonos`, una venta con
  tres abonos contaría su `monto_total` tres veces y el facturado saldría
  inflado.
- **B5 genera los días primero con `generate_series`.** Sin eso, un día sin
  órdenes no aparece: el eje se comprime y la línea miente sobre la pendiente.
- **Los nombres de día y mes se arman a mano**, no con `to_char(..., 'TMDy')`.
  El idioma depende de la configuración del servidor, y no es la misma en Neon,
  en Windows y en el equipo de cada quien.
- **A2 ordena por el `ENUM`.** La lista de estados está declarada en el orden
  del flujo, así que `ORDER BY estado` ya ordena por el proceso.
- **A3 cuenta sobre el detalle y valora con el precio copiado**, no con el de
  lista: una orden con tres servicios cuenta para los tres, y el valor no cambia
  si mañana sube el catálogo.
- **El saldo nunca se guarda.** `v_ventas` lo calcula cada vez; por eso B4 y B7
  no pueden dar un saldo desactualizado.
- **La garantía se cuenta desde la entrega y por servicio**, con los días que
  se copiaron a la orden: lo ya entregado conserva la garantía que se le
  prometió aunque el catálogo cambie.
