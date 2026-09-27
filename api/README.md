# API — Portal RvR Tecnologías (v6)

Node + Express 5 + TypeScript sobre PostgreSQL. La usan el **portal web** (administrativo y del cliente) y la **app móvil del técnico** (`/api/movil`).

## Arranque

En Windows: **`montar-base.bat`** (crea la base y escribe `api/.env`) y luego **`iniciar.bat`** (levanta esta API y el portal), ambos en la raíz del proyecto.

```bash
cd api
npm install
cp .env.example .env     # completa DATABASE_URL y JWT_SECRET
npm run dev              # http://localhost:4000/api
```

Comprobación: `GET http://localhost:4000/api/salud` → `{"ok":true,"base":"conectada","version":"v6"}`. Producción: `npm run build` y `npm start`.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL (local, Neon o Supabase; fuera de localhost usa TLS) |
| `JWT_SECRET` | Firma de las sesiones. **Cámbiala**: con ella se fabrica un token de administrador |
| `SESION_HORAS` | Duración de la sesión (8) |
| `PORT` | Puerto (4000) |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma (además se aceptan localhost y la red local) |
| `PORTAL_URL` | Dirección del portal para el enlace de recuperación |
| `INTENTOS_MAXIMOS`, `MINUTOS_BLOQUEO`, `MINUTOS_RECUPERACION` | Bloqueo de ingreso (3 / 5 min) y vigencia del enlace (30 min) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Correo saliente (opcional) |
| `TZ` | Zona horaria de la API y de la sesión de PostgreSQL (America/Bogota) |

## Seguridad y sesiones

- **Permisos por caso de uso**: cada endpoint exige uno o varios permisos `modulo.accion` (82 en total). En cada petición se recargan el usuario y los permisos de su rol desde la base (RNF-021): un cambio en Roles aplica de inmediato.
- **Token JWT** con `usuarioId`, `canal` y `version_sesion`. Cerrar sesión, «cerrar en todos los dispositivos», restablecer la contraseña o inactivar la cuenta suben la versión e invalidan los tokens anteriores.
- **Tipo de cuenta** según los permisos del rol: `administrativo`, `cliente` o `tecnico`. El portal web rechaza al técnico (`USAR_APP_MOVIL`); el canal `movil` exige `movil.acceso` y un técnico activo vinculado.
- **Contraseñas** con bcrypt; política: 8 a 72 caracteres con mayúscula, minúscula y número. Las temporales (`RvR-XXXX-XXXX`) se muestran una sola vez.
- **Registro de accesos** en `registro_acceso`: éxitos, fallos, bloqueos, cierres y recuperaciones, con canal e IP.
- **Errores** con forma `{codigo, mensaje, detalles?}`: 401 sesión, 403 permiso, 404, 409 conflicto (duplicados, `CONFIRMAR_CAMBIO`), 422 regla de negocio o datos inválidos (con el campo), 423 cuenta bloqueada.

## Endpoints

Todos cuelgan de `/api` y, salvo los públicos, exigen `Authorization: Bearer <token>`.

### Acceso y autogestión (HU_13, HU_14, HU_72–HU_77)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| POST | `/api/auth/login` | — | HU_13 · Inicia sesión con usuario o correo. Body `{usuario, contrasena, canal?: "web"/"movil"}`. Bloquea 5 min tras 3 fallos (CA_13_05). El técnico solo entra con `canal: "movil"`. |
| POST | `/api/auth/logout` | sesión | HU_14 / Móvil HU_02 · Cierra la sesión: invalida el token (sube `version_sesion`) y lo registra en accesos. |
| POST | `/api/auth/logout-todo` | sesión | Cierra la sesión en todos los dispositivos. |
| POST | `/api/auth/recuperar` | — | HU_72 · Envía el enlace de recuperación (30 min). Responde igual exista o no el correo. Sin SMTP, en desarrollo devuelve `enlaceDesarrollo`. |
| GET | `/api/auth/restablecer/:token` | — | CA_73_01 · el portal valida el enlace antes de pedir la contraseña nueva. |
| POST | `/api/auth/restablecer` | — | HU_73 · Contraseña nueva con el token del enlace (un solo uso). Cierra las demás sesiones. |
| POST | `/api/auth/registro` | — | HU_75 · Registro del cliente. Si RvR ya lo tenía registrado por documento, vincula la cuenta a su historial (CA_75_03). |
| GET | `/api/auth/perfil` | sesión | Cuenta de la sesión con su rol, tipo de cuenta (administrativo, cliente, técnico) y permisos. |
| PUT | `/api/auth/perfil` | sesión | Mis datos, para el personal. El cliente actualiza los suyos en /portal/perfil. |
| POST | `/api/auth/contrasena` | sesión | CA_77_04 · cambio de contraseña exigiendo la actual. |

### Público (sin sesión)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/publico/servicios` | — | HU_21 · Catálogo público: solo servicios activos, con filtro por categoría y búsqueda. |

### Roles (HU_01–HU_06)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/roles` | `roles.listar`, `roles.buscar` | HU_03 listar · HU_02 buscar por nombre o estado |
| GET | `/api/roles/opciones` | `usuarios.registrar`, `usuarios.editar`, `usuarios.listar` | CA_05_03 · Solo los roles activos se ofrecen al crear o editar usuarios. |
| GET | `/api/roles/:id` | `roles.ver_detalle`, `roles.editar` | HU_06 · Ver detalle (solo lectura) |
| POST | `/api/roles` | `roles.registrar` | HU_01 · Registrar rol con sus permisos |
| PUT | `/api/roles/:id` | `roles.editar` | HU_04 · Editar rol y permisos |
| PATCH | `/api/roles/:id/estado` | `roles.cambiar_estado` | HU_05 · Cambiar estado |

### Permisos (HU_66–HU_71)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/permisos/modulos` | `permisos.listar`, `permisos.buscar`, `permisos.registrar`, `permisos.editar`, `roles.registrar`, `roles.editar` | CA_66_03 · Módulos definidos en el sistema. |
| GET | `/api/permisos/catalogo` | `roles.registrar`, `roles.editar`, `roles.ver_detalle` | Catálogo agrupado por módulo para el formulario de roles (casillas). CA_70_03 · los inactivos no se ofrecen (llegan marcados para mostrarlos solo si el rol ya los tenía). |
| GET | `/api/permisos` | `permisos.listar`, `permisos.buscar` | HU_68 listar · HU_67 buscar por nombre, módulo o estado |
| GET | `/api/permisos/:id` | `permisos.ver_detalle`, `permisos.editar` | HU_71 · Ver detalle |
| POST | `/api/permisos` | `permisos.registrar` | HU_66 · Registrar |
| PUT | `/api/permisos/:id` | `permisos.editar` | HU_69 · Editar |
| PATCH | `/api/permisos/:id/estado` | `permisos.cambiar_estado` | HU_70 · Cambiar estado (CA_70_04: los permisos no se eliminan) |

### Usuarios (HU_07–HU_12)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/usuarios` | `usuarios.listar`, `usuarios.buscar` | HU_09 listar · HU_08 buscar por nombres, apellidos, correo, rol o estado |
| GET | `/api/usuarios/:id` | `usuarios.ver_detalle`, `usuarios.editar` | HU_12 · Ver detalle |
| POST | `/api/usuarios` | `usuarios.registrar` | HU_07 · Registrar usuario. La contraseña temporal se muestra una sola vez. |
| PUT | `/api/usuarios/:id` | `usuarios.editar` | HU_10 · Editar |
| PATCH | `/api/usuarios/:id/estado` | `usuarios.cambiar_estado` | HU_11 · Cambiar estado (CA_11_03: los usuarios no se eliminan) |
| POST | `/api/usuarios/:id/contrasena` | `usuarios.editar` | Restablecer la contraseña de una cuenta desde administración (temporal, una vez). |

### Registro de accesos (HU_74)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/accesos` | `accesos.consultar` | HU_74 · Intentos de ingreso con resultado, canal (web/móvil), IP y fecha; filtros y resumen. |

### Catálogo de servicios (HU_15–HU_21)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/servicios/categorias` | sesión | Categorías del catálogo (CHECK de la tabla `servicio`). |
| GET | `/api/servicios` | `servicios.listar`, `servicios.buscar`, `cotizaciones.registrar`, `cotizaciones.editar` | HU_17 listar · HU_16 buscar por nombre, categoría o estado |
| GET | `/api/servicios/:id` | `servicios.ver_detalle`, `servicios.editar` | HU_20 · Ver detalle |
| POST | `/api/servicios` | `servicios.registrar` | HU_15 · Registrar |
| PUT | `/api/servicios/:id` | `servicios.editar` | HU_18 · Editar. CA_18_03: el precio nuevo no toca las cotizaciones ya registradas, porque cada ítem guarda su propio precio_unitario. |
| PATCH | `/api/servicios/:id/estado` | `servicios.cambiar_estado` | HU_19 · Cambiar estado (CA_19_03: no se eliminan) |

### Técnicos (HU_22–HU_27)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/tecnicos/especialidades` | `tecnicos.listar`, `tecnicos.buscar`, `disponibilidad.consultar`, `agenda.agendar` | Especialidades registradas, para el filtro (CA_24_02). |
| GET | `/api/tecnicos/opciones` | `tecnicos.listar`, `disponibilidad.consultar`, `disponibilidad.registrar`, `agenda.consultar`, `agenda.agendar`, `reportes.tecnicos`, `reportes.ordenes`, `ordenes.listar` | Técnicos para selects (disponibilidad, agenda, reportes). |
| GET | `/api/tecnicos` | `tecnicos.listar`, `tecnicos.buscar` | HU_24 listar · HU_23 buscar por nombres, apellidos, documento, especialidad o estado |
| GET | `/api/tecnicos/:id` | `tecnicos.ver_detalle`, `tecnicos.editar` | HU_27 · Ver detalle |
| POST | `/api/tecnicos` | `tecnicos.registrar` | HU_22 · Registrar técnico (y, si se pide, su cuenta para la app móvil) |
| POST | `/api/tecnicos/:id/cuenta` | `tecnicos.editar` | Crear después la cuenta móvil de un técnico ya registrado. |
| PUT | `/api/tecnicos/:id` | `tecnicos.editar` | HU_25 · Editar |
| PATCH | `/api/tecnicos/:id/estado` | `tecnicos.cambiar_estado` | HU_26 · Cambiar estado (CA_26_04: no se eliminan) |

### Horarios técnicos (HU_28–HU_30)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/disponibilidad` | `disponibilidad.consultar`, `agenda.agendar`, `agenda.reprogramar` | HU_29 · Consultar la disponibilidad por técnico y rango de fechas (CA_29_01), con filtro por técnico, especialidad o fecha (CA_29_03). |
| GET | `/api/disponibilidad/libres` | `agenda.agendar`, `agenda.reprogramar` | CA_51_02 · Franjas libres para agendar: técnicos activos con la franja en «disponible» (CA_30_02: las ocupadas o bloqueadas no se ofrecen). |
| POST | `/api/disponibilidad` | `disponibilidad.registrar` | HU_28 · Registrar franja(s). Con `repetirHasta`, la misma franja en cada día hábil. |
| PATCH | `/api/disponibilidad/:id/estado` | `disponibilidad.cambiar_estado` | HU_30 · Cambiar el estado de una franja (disponible, ocupada o bloqueada). |

### Clientes (HU_31–HU_35, HU_83)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/clientes/opciones` | `cotizaciones.registrar`, `clientes.listar`, `reportes.ordenes`, `ordenes.listar` | Clientes activos para los selects (CA_83_02: un inactivo no recibe cotizaciones). |
| GET | `/api/clientes` | `clientes.listar`, `clientes.buscar` | HU_33 listar · HU_32 buscar por nombres, apellidos, documento, teléfono o estado |
| GET | `/api/clientes/:id` | `clientes.ver_detalle`, `clientes.editar` | HU_35 · Ver detalle |
| POST | `/api/clientes` | `clientes.registrar` | HU_31 · Registrar (CA_31_04: fecha de registro automática; CA_31_05: activo) |
| PUT | `/api/clientes/:id` | `clientes.editar` | HU_34 · Editar |
| PATCH | `/api/clientes/:id/estado` | `clientes.cambiar_estado` | HU_83 · Cambiar estado (CA_83_05: no se eliminan) |

### Cotizaciones · maestro-detalle (HU_36–HU_41, HU_81)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/cotizaciones` | `cotizaciones.listar`, `cotizaciones.buscar` | HU_38 listar · HU_37 buscar por cliente, fecha o estado |
| GET | `/api/cotizaciones/:id` | `cotizaciones.ver_detalle`, `cotizaciones.editar` | HU_41 · Ver detalle |
| POST | `/api/cotizaciones` | `cotizaciones.registrar` | HU_36 · Registrar cotización (desde cero). Nace «solicitada» (CA_36_05). |
| PUT | `/api/cotizaciones/:id` | `cotizaciones.editar` | HU_39 · Editar (valorar una solicitud también es editarla). CA_39_02 · solo «solicitada» o «pendiente». CA_39_04 · si ya se había enviado, vuelve a «solicitada» y hay que reenviarla. |
| POST | `/api/cotizaciones/:id/enviar` | `cotizaciones.enviar` | HU_81 · Enviar la cotización al cliente |
| POST | `/api/cotizaciones/:id/decision` | `cotizaciones.registrar_decision` | HU_40 · Registrar la aprobación o el rechazo (el cliente respondió por teléfono, WhatsApp o en persona) |

### Órdenes de servicio (HU_44–HU_50)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/ordenes` | `ordenes.listar`, `ordenes.buscar` | HU_46 listar · HU_45 buscar por código, cliente, técnico, fecha o estado |
| GET | `/api/ordenes/cotizaciones-aprobadas` | `ordenes.registrar` | Cotizaciones aprobadas que aún no generan orden (CA_44_01 / CA_44_04). |
| GET | `/api/ordenes/:id` | `ordenes.ver_detalle` | HU_50 · Ver detalle |
| POST | `/api/ordenes` | `ordenes.registrar` | HU_44 · Registrar la orden a partir de una cotización aprobada. CA_44_02 código automático · CA_44_03 un ítem por ítem cotizado · CA_44_04 una sola orden por cotización · CA_44_05 ítems «pendiente» con fecha de asignación · CA_44_06 orden «esperando anticipo». |
| PATCH | `/api/ordenes/:id/observaciones` | `ordenes.registrar_observaciones` | HU_47 · Registrar observaciones generales de la orden |
| PATCH | `/api/ordenes/:id/items/:itemId` | `ordenes.cambiar_estado_item`, `ordenes.registrar_observaciones` | HU_49 · Cambiar estado de un ítem · CA_47_02 · notas del técnico por ítem |
| PATCH | `/api/ordenes/:id/estado` | `ordenes.cambiar_estado` | HU_48 · Cambiar estado de la orden |

### Agendamiento (HU_51–HU_54)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/agenda` | `agenda.consultar` | HU_52 · Calendario de visitas con filtro por técnico, fechas o estado (CA_52_02). |
| GET | `/api/agenda/ordenes` | `agenda.agendar` | Órdenes que se pueden agendar: las que no están cerradas. |
| POST | `/api/agenda` | `agenda.agendar` | HU_51 · Agendar visita técnica (CA_51_05: una orden puede tener varias). |
| POST | `/api/agenda/:id/reprogramar` | `agenda.reprogramar` | HU_53 · Reprogramar o reasignar: cambia fecha, técnico o ambos. CA_53_02 valida disponibilidad · CA_53_03 libera la franja anterior y ocupa la nueva · CA_53_04 conserva la visita anterior (queda «reprogramada»). |
| PATCH | `/api/agenda/:id/estado` | `agenda.cambiar_estado` | HU_54 · Cambiar estado de la visita (cumplida o cancelada) con notas (CA_54_03). |

### Ventas (HU_55–HU_57)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/ventas` | `ventas.consultar_estado` | HU_56 · Estado de pago de las ventas (listado con filtro y búsqueda). |
| GET | `/api/ventas/ordenes-sin-venta` | `ventas.registrar` | Órdenes que aún no tienen venta (para registrarla). |
| GET | `/api/ventas/orden/:ordenId` | `ventas.consultar_estado` | Estado de pago de una orden concreta (lo usa el detalle de la orden). |
| GET | `/api/ventas/:id` | `ventas.consultar_estado` | HU_56 · Consultar estado de pago |
| POST | `/api/ventas` | `ventas.registrar` | HU_55 · Registrar la venta de una orden. CA_55_01 total = cotizaciones aprobadas de la orden · CA_55_02 una por orden · CA_55_03 anticipo del 50 %, ajustable · CA_55_04 «pendiente de anticipo». |
| PATCH | `/api/ventas/:id/estado` | `ventas.cambiar_estado` | HU_57 · Cambiar el estado de pago. Anticipo, abonada y pagada los pone la base al registrar cada abono (CA_57_01, CA_57_02); aquí se anula la venta (CA_57_03) o se recalcula su estado. |

### Abonos (HU_58, HU_59)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/abonos` | `abonos.listar` | HU_59 · Listar abonos con filtro por tipo, método o fechas y total filtrado (CA_59_03). |
| GET | `/api/abonos/ventas-con-saldo` | `abonos.registrar` | Ventas que reciben abonos (con saldo y no anuladas). |
| POST | `/api/abonos` | `abonos.registrar` | HU_58 · Registrar abono. CA_58_02 mayor que cero y sin superar el saldo · CA_58_03 fecha automática · CA_58_04 recalcula saldo y estado de pago (trigger fn_abono_venta). Con el anticipo cubierto, la orden que lo esperaba pasa a «en proceso». |

### Reportes (HU_60–HU_62)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/reportes/ordenes` | `reportes.ordenes` | HU_60 · Reporte de órdenes de servicio por período, cliente, técnico o estado. |
| GET | `/api/reportes/tecnicos` | `reportes.tecnicos` | HU_61 · Reporte de servicios prestados por técnico. |

### Indicadores (HU_63, HU_64)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/indicadores/servicios-ordenes` | `indicadores.servicios_ordenes` | HU_63 · Servicios realizados y órdenes por estado. |
| GET | `/api/indicadores/mas-solicitados` | `indicadores.mas_solicitados` | HU_64 · Servicios más solicitados y técnicos con más servicios ejecutados. |

### Estadísticas (HU_65)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/estadisticas` | `estadisticas.consultar` | HU_65 · Estadísticas generales: total de órdenes, servicios más solicitados, ingresos del período (CA_65_02: calculados con los abonos) y tasa de aprobación de cotizaciones, con rango personalizable (CA_65_04). |

### Notificaciones

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/notificaciones` | sesión | Avisos de la cuenta (no leídos primero). |
| PATCH | `/api/notificaciones/:id/leida` | sesión |  |
| POST | `/api/notificaciones/leer-todas` | sesión |  |

### Buscador global

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/busqueda` | sesión | Órdenes, cotizaciones, clientes, técnicos, servicios y usuarios, según los permisos del rol. |

### Portal del cliente (HU_76–HU_80, HU_82)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/portal/perfil` | `portal.consultar_perfil` | HU_76 · Consultar mis datos de perfil |
| PUT | `/api/portal/perfil` | `portal.actualizar_perfil` | HU_77 · Actualizar mis datos. CA_77_02: el documento no se edita. CA_77_03: el correo no puede estar en uso por otra cuenta. La contraseña se cambia en POST /auth/contrasena, que exige la actual (CA_77_04). |
| GET | `/api/portal/resumen` | sesión | Inicio del portal: lo que el cliente tiene pendiente. |
| GET | `/api/portal/cotizaciones` | `portal.consultar_cotizaciones` | HU_79 · Consultar mis cotizaciones (CA_79_01: solo las del cliente autenticado). |
| GET | `/api/portal/cotizaciones/:id` | `portal.consultar_cotizaciones` | HU_79 · Detalle de mi cotización con servicios y repuestos (CA_79_03). |
| POST | `/api/portal/solicitudes` | `portal.solicitar_servicios` | HU_78 · Solicitar los servicios que necesito. CA_78_01 servicios activos con cantidad · CA_78_02 problema y dirección · CA_78_03 crea una cotización «solicitada», sin valores · CA_78_04 avisa al administrador · CA_78_05 queda en «mis cotizaciones». |
| POST | `/api/portal/cotizaciones/:id/decision` | `portal.decidir_cotizacion` | HU_80 · Aprobar o rechazar mi cotización (CA_80_05: la decisión no se cambia). |
| GET | `/api/portal/ordenes` | `portal.consultar_ordenes` | HU_82 · Consultar mis órdenes (código, servicios, estado y fecha de visita). |
| GET | `/api/portal/ordenes/:id` | `portal.consultar_ordenes` | HU_82 · Detalle de mi orden: técnico, pago y solución (solo lectura). |

### App móvil del técnico (Móvil HU_01–HU_11)

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/movil/ordenes` | `movil.consultar_ordenes` | Móvil HU_03 · Órdenes asignadas activas, con filtro por fecha o estado (CA_03_03). |
| GET | `/api/movil/ordenes/:id` | `movil.consultar_ordenes` | Detalle de una orden asignada, con lo necesario para la visita. |
| GET | `/api/movil/ordenes/:id/historial` | `movil.consultar_historial` | Móvil HU_10 · Historial de cambios de estado y observaciones, cronológico (CA_10_03). |
| POST | `/api/movil/visitas/:id/inicio` | `movil.registrar_visita` | Móvil HU_04 · Registrar inicio de visita. CA_04_02 hora automática y orden «en proceso» (si tiene el anticipo, CA_48_03) · CA_04_03 avisa al administrador. |
| POST | `/api/movil/visitas/:id/fin` | `movil.registrar_visita` | Móvil HU_05 · Registrar finalización. CA_05_02 exige diagnóstico y solución · CA_05_03 hora de cierre y orden «finalizada» · CA_05_04 avisa al administrador y al cliente. |
| PATCH | `/api/movil/ordenes/:id/estado` | `movil.actualizar_estado` | Móvil HU_09 · Actualizar estado de la orden (solo transiciones del técnico). |
| PUT | `/api/movil/ordenes/:id/diagnostico` | `movil.reporte_tecnico` | Móvil HU_06 · Registrar diagnóstico del equipo (vinculado a la orden). |
| PUT | `/api/movil/ordenes/:id/solucion` | `movil.reporte_tecnico` | Móvil HU_08 · Registrar solución aplicada. |
| POST | `/api/movil/ordenes/:id/materiales` | `movil.reporte_tecnico` | Móvil HU_07 · Registrar materiales utilizados (varios por orden, CA_07_02). |
| GET | `/api/movil/ordenes/:id/materiales` | `movil.reporte_tecnico`, `movil.consultar_ordenes` | Móvil HU_07 · Materiales registrados en la orden. |
| POST | `/api/movil/ordenes/:id/recotizacion` | `movil.solicitar_recotizacion` | Móvil HU_11 · Solicitar recotización por repuesto. CA_11_02 crea una cotización «solicitada» del mismo cliente, ligada a la orden, y avisa al administrador · CA_11_03 la orden queda «en espera de repuesto». |
| PATCH | `/api/movil/ordenes/:id/items/:itemId` | `movil.reporte_tecnico` | Ítems: el técnico puede avanzar el estado y dejar notas por ítem. |

## Conectar la app móvil

1. `POST /api/auth/login` con `{"usuario":"jmora","contrasena":"RvR2026*tecnico","canal":"movil"}` → `{token, usuario}`.
2. Enviar `Authorization: Bearer <token>` en cada petición.
3. `GET /api/movil/ordenes` (hoy y próximas; `?historial=true` para las cerradas, `?fecha=AAAA-MM-DD`, `?estado=`) → cada fila trae `visitaId` y `ordenId`.
4. En la visita: `POST /api/movil/visitas/:visitaId/inicio` → `PUT …/ordenes/:ordenId/diagnostico` → `POST …/materiales` → `PUT …/solucion` → `POST /api/movil/visitas/:visitaId/fin` (exige diagnóstico y solución y finaliza la orden).
5. Si falta un repuesto: `POST /api/movil/ordenes/:ordenId/recotizacion` (la orden pasa a «en espera de repuesto» y el administrador la valora y la envía al cliente).
6. `POST /api/auth/logout` al cerrar sesión.

Desde un celular en la misma red: levanta la API y usa la IP del computador (`http://192.168.x.x:4000/api`); CORS ya acepta direcciones de la red local.

## Pruebas

Contra una base recién montada con datos de demostración:

```bash
node pruebas/flujo-completo.mjs   # 147 comprobaciones: flujo completo de la ficha técnica
node pruebas/complementos.mjs     # 131 comprobaciones: resto de casos de uso
```
