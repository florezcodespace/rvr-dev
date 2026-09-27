# Base de datos · PostgreSQL · modelo v6

El modelo sale de la imagen **«BASE DE DATOS FINAL»** (16 tablas), con los 11
ajustes del **Control de cambios v6** de la matriz y cuatro tablas que exigen los
criterios de aceptación. En total, **20 tablas y 2 vistas**.

| Archivo | Qué hace | Cuándo se corre |
|---|---|---|
| `modelo.dbml` | El modelo, para pegarlo en [dbdiagram.io](https://dbdiagram.io) y ver el diagrama | Es la referencia, no se ejecuta |
| `01-esquema.sql` | Crea las 20 tablas, los estados (CHECK), los disparadores y las vistas | Al crear la base |
| `02-catalogos.sql` | Roles, los 82 permisos (uno por caso de uso), servicios y las cuentas de acceso | Al crear la base |
| `99-datos-demo.sql` | **Opcional.** Clientes, técnicos, franjas, ~65 cotizaciones y ~45 órdenes con su venta, abonos, visitas y reporte técnico | Solo en la base de pruebas o de sustentación |
| `03-kpis.sql` | Las consultas de Reportes, Indicadores y Estadísticas para comprobarlas a mano. Solo `SELECT` | Cuando quieras consultar |
| `montar.ps1` | Lo usa `montar-base.bat` (raíz del proyecto): crea la base, la carga y escribe los `.env` | Para montar o reiniciar |
| `anterior-15-tablas/`, `anterior-11-tablas/` | Los modelos anteriores, tal como estaban | Solo de consulta |

> ⚠️ `01-esquema.sql` borra las tablas antes de crearlas. Sirve para montar la
> base desde cero, **nunca** sobre una base con datos reales.

## Montarla en Windows

Doble clic en **`montar-base.bat`**, en la raíz del proyecto:

1. Busca PostgreSQL y pide la contraseña del usuario `postgres`.
2. Borra la base `rvr` y la crea de nuevo (pide escribir `SI`).
3. Carga `01-esquema.sql` y `02-catalogos.sql`, y pregunta si quieres los datos de demostración.
4. Escribe `api/.env` (conexión y clave de sesiones) y `.env` del portal.
5. Instala las dependencias de la API si faltan.

Luego **`iniciar.bat`** levanta la API y el portal.

A mano (psql):

```bash
createdb -U postgres rvr
psql -U postgres -d rvr -f db/01-esquema.sql
psql -U postgres -d rvr -f db/02-catalogos.sql
psql -U postgres -d rvr -f db/99-datos-demo.sql   # opcional
```

## Las tablas y de dónde sale cada una

| Tabla | Origen | Casos de uso |
|---|---|---|
| `rol`, `permiso`, `rol_x_permiso` | Imagen | HU_01–HU_06, HU_66–HU_71 |
| `usuario` | Imagen + `token_recuperacion`, `token_vence`, `version_sesion` | HU_07–HU_14, HU_72, HU_73 |
| `registro_acceso` | CA_13_05 · HU_74 | Intentos de ingreso, bloqueo (3 fallos → 5 min), cierres de sesión |
| `cliente` | Imagen + `usuario_id`, `estado` (v6) | HU_31–HU_35, HU_83, HU_75–HU_77 |
| `tecnico` | Imagen (antes `terceros`, renombrada en v6) + `usuario_id` | HU_22–HU_27, app móvil |
| `disponibilidad` | Imagen + `motivo` | HU_28–HU_30 |
| `servicio` | Imagen + `categoria` (v6) | HU_15–HU_21 |
| `cotizacion` | Imagen + envío, respuesta, motivo de rechazo, origen, descripción, dirección, orden (recotización) | HU_36–HU_41, HU_78–HU_81, móvil HU_11 |
| `detalle_cotizacion` | Imagen: **maestro-detalle** con `servicio_id`, `cantidad`, `precio_unitario` y `subtotal` calculado; + repuestos (v6) | HU_36, HU_39 |
| `orden` | Imagen, estados v6, código `OS-AAAA-NNNN` automático | HU_44–HU_50, HU_82 |
| `detalle_orden` | Imagen: cada ítem aprobado de la cotización es un ítem de la orden, con su estado | HU_44, HU_49 |
| `diagnostico` | Imagen + técnico, hallazgos, solución | Móvil HU_06, HU_08 · HU_50 |
| `material_orden` | Móvil HU_07 | Materiales usados en la visita |
| `historial_orden` | CA_48_04 · móvil HU_10 | Cada cambio de estado, con quién y cuándo |
| `agendamiento` | Imagen + franja, inicio y fin de la visita | HU_51–HU_54, móvil HU_04, HU_05 |
| `ventas`, `abonos` | Imagen + método de pago y referencia | HU_55–HU_59 |
| `notificacion` | CA_78_04, CA_80_03, móvil CA_09_04 | Avisos entre portal, cliente y móvil |
| `v_ventas`, `v_orden_cliente` | Vistas | Saldo y abonado calculados; cliente de cada orden |

## Reglas que cuida la base (no solo la API)

- **Estados** con `CHECK` en cada tabla (`activo/inactivo`, estados de cotización, orden, ítem, visita, franja y pago).
- **Monto de la cotización** = suma de los subtotales (`fn_monto_cotizacion`).
- **Código de la orden** `OS-2026-0001` automático (`fn_codigo_orden`).
- **Una orden, un cliente**: todos los ítems deben venir de cotizaciones del mismo cliente (`fn_detalle_orden_mismo_cliente`).
- **Abonos**: no se aceptan en ventas anuladas, no superan el saldo y recalculan saldo y estado de pago (`fn_abono_venta`). Cuando el anticipo queda cubierto, la API pasa la orden a «en proceso».
- **Franjas** del mismo técnico no se cruzan (`fn_franja_sin_cruce`).
- **Historial** automático de cada cambio de estado de la orden (`fn_historial_orden`).
- El **precio del servicio** queda congelado en la cotización: cambiar el precio base no altera cotizaciones hechas.

## Cuentas que crea `02-catalogos.sql`

| Usuario | Correo | Contraseña | Rol |
|---|---|---|---|
| `rvargas` | ricardo.vargas@rvrtec.co | `RvR2026*admin` | Administrador |
| `lgomez` | laura.gomez@rvrtec.co | `RvR2026*coord` | Coordinador |
| `jmora` | julian.mora@rvrtec.co | `RvR2026*tecnico` | Técnico (solo app móvil) |

Con los datos de demostración, además: `asuarez` / ana.suarez@gmail.com y
`crestrepo` / carlos.restrepo@gmail.com, contraseña `RvR2026*cliente` (rol
Cliente), y el técnico `sherrera` con `RvR2026*tecnico`.

> Cambia estas contraseñas antes de usar la base con datos reales.
