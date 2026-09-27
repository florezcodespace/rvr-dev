# Trazabilidad v6 · historia de usuario → pantalla → API → permiso

Cada historia de usuario de la matriz v6 (81 web + 11 móvil) con la pantalla del portal que la cumple, el endpoint de la API que la ejecuta y el permiso que la habilita. Los permisos se asignan a cada rol en **Configuración → Roles**; la API los vuelve a comprobar en cada petición (RNF-021), así que ocultar un botón nunca es la única barrera.

Portales: **administrativo** (`/panel`, `/roles`, … — Administrador, Coordinador o cualquier rol con permisos del portal), **cliente** (`/portal/…` — rol Cliente) y **público** (`/`, `/catalogo`, `/login`, `/registro`, `/recuperar`, `/restablecer`). El técnico **no** entra a la web: trabaja desde la app móvil contra `/api/movil/…`.


## Configuración · Gestión de Roles

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_01 | Admin | Registrar un nuevo rol | `/roles/nuevo` | `POST /api/roles` | `roles.registrar` |
| HU_02 | Admin | Buscar un rol | `/roles (buscador y filtro de estado)` | `GET /api/roles?q=&estado=` | `roles.buscar` |
| HU_03 | Admin | Listar los roles | `/roles` | `GET /api/roles` | `roles.listar` |
| HU_04 | Admin | Editar un rol | `/roles/:id/editar` | `PUT /api/roles/:id` | `roles.editar` |
| HU_05 | Admin | Cambiar el estado de un rol | `/roles (badge de estado) · /roles/:id` | `PATCH /api/roles/:id/estado` | `roles.cambiar_estado` |
| HU_06 | Admin | Ver el detalle de un rol | `/roles/:id` | `GET /api/roles/:id` | `roles.ver_detalle` |

## Configuración · Gestión de Permisos

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_66 | Admin | Registrar un permiso | `/permisos (Registrar permiso)` | `POST /api/permisos` | `permisos.registrar` |
| HU_67 | Admin | Buscar un permiso | `/permisos (buscador, módulo, estado)` | `GET /api/permisos?q=&modulo=&estado=` | `permisos.buscar` |
| HU_68 | Admin | Listar los permisos | `/permisos` | `GET /api/permisos` | `permisos.listar` |
| HU_69 | Admin | Editar un permiso | `/permisos/:id (Editar)` | `PUT /api/permisos/:id` | `permisos.editar` |
| HU_70 | Admin | Cambiar el estado de un permiso | `/permisos (badge de estado)` | `PATCH /api/permisos/:id/estado` | `permisos.cambiar_estado` |
| HU_71 | Admin | Ver el detalle de un permiso | `/permisos/:id` | `GET /api/permisos/:id` | `permisos.ver_detalle` |

## Usuarios · Gestión de Usuarios

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_07 | Admin | Registrar un nuevo usuario | `/usuarios (Registrar usuario)` | `POST /api/usuarios` | `usuarios.registrar` |
| HU_08 | Admin | Buscar un usuario | `/usuarios (buscador, rol, estado)` | `GET /api/usuarios?q=&rol=&estado=` | `usuarios.buscar` |
| HU_09 | Admin | Listar los usuarios | `/usuarios` | `GET /api/usuarios` | `usuarios.listar` |
| HU_10 | Admin | Editar un usuario | `/usuarios/:id (Editar)` | `PUT /api/usuarios/:id · POST /api/usuarios/:id/contrasena` | `usuarios.editar` |
| HU_11 | Admin | Cambiar el estado de un usuario | `/usuarios (badge de estado)` | `PATCH /api/usuarios/:id/estado` | `usuarios.cambiar_estado` |
| HU_12 | Admin | Ver el detalle de un usuario | `/usuarios/:id` | `GET /api/usuarios/:id` | `usuarios.ver_detalle` |
| HU_75 | Cliente | Registrarme en el portal | `/registro` | `POST /api/auth/registro` | `público` |
| HU_76 | Cliente | Consultar mis datos de perfil | `/portal/perfil` | `GET /api/portal/perfil` | `portal.consultar_perfil` |
| HU_77 | Cliente | Actualizar mis datos de perfil | `/portal/perfil (Actualizar mis datos, Cambiar contraseña)` | `PUT /api/portal/perfil · POST /api/auth/contrasena` | `portal.actualizar_perfil` |

## Usuarios · Gestión de Acceso

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_13 | Usuario | Iniciar sesión | `/login` | `POST /api/auth/login` | `público` |
| HU_14 | Usuario | Cerrar sesión | `Botón salir (barra superior)` | `POST /api/auth/logout · POST /api/auth/logout-todo` | `sesión` |
| HU_72 | Usuario | Solicitar la recuperación de mi contraseña | `/recuperar` | `POST /api/auth/recuperar` | `público` |
| HU_73 | Usuario | Restablecer mi contraseña | `/restablecer?token=` | `GET /api/auth/restablecer/:token · POST /api/auth/restablecer` | `público` |
| HU_74 | Admin | Consultar el registro de accesos al sistema | `/accesos` | `GET /api/accesos` | `accesos.consultar` |

## Servicios · Catálogo de Servicios

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_15 | Admin | Registrar un servicio | `/servicios (Registrar servicio)` | `POST /api/servicios` | `servicios.registrar` |
| HU_16 | Admin | Buscar un servicio | `/servicios (buscador, categoría, estado)` | `GET /api/servicios?q=&categoria=&estado=` | `servicios.buscar` |
| HU_17 | Admin | Listar los servicios del catálogo | `/servicios` | `GET /api/servicios` | `servicios.listar` |
| HU_18 | Admin | Editar un servicio | `/servicios/:id (Editar)` | `PUT /api/servicios/:id` | `servicios.editar` |
| HU_19 | Admin | Cambiar el estado de un servicio | `/servicios (badge de estado)` | `PATCH /api/servicios/:id/estado` | `servicios.cambiar_estado` |
| HU_20 | Admin | Ver el detalle de un servicio | `/servicios/:id` | `GET /api/servicios/:id` | `servicios.ver_detalle` |
| HU_21 | Cliente | Consultar el catálogo de servicios | `/catalogo (público) · /portal/catalogo` | `GET /api/publico/servicios` | `público` |

## Servicios · Gestión de Técnicos

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_22 | Admin | Registrar un técnico | `/tecnicos (Registrar técnico, con cuenta móvil opcional)` | `POST /api/tecnicos · POST /api/tecnicos/:id/cuenta` | `tecnicos.registrar` |
| HU_23 | Admin | Buscar un técnico | `/tecnicos (buscador, especialidad, estado)` | `GET /api/tecnicos?q=&especialidad=&estado=` | `tecnicos.buscar` |
| HU_24 | Admin | Listar los técnicos | `/tecnicos` | `GET /api/tecnicos` | `tecnicos.listar` |
| HU_25 | Admin | Editar un técnico | `/tecnicos/:id (Editar)` | `PUT /api/tecnicos/:id` | `tecnicos.editar` |
| HU_26 | Admin | Cambiar el estado de un técnico | `/tecnicos (badge de estado, confirma si tiene visitas)` | `PATCH /api/tecnicos/:id/estado` | `tecnicos.cambiar_estado` |
| HU_27 | Admin | Ver el detalle de un técnico | `/tecnicos/:id` | `GET /api/tecnicos/:id` | `tecnicos.ver_detalle` |

## Servicios · Gestión de Horarios Técnicos

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_28 | Admin | Registrar la disponibilidad de un técnico | `/horarios (Registrar disponibilidad, repetir por días)` | `POST /api/disponibilidad` | `disponibilidad.registrar` |
| HU_29 | Admin | Consultar la disponibilidad de los técnicos | `/horarios (semana por técnico)` | `GET /api/disponibilidad · GET /api/disponibilidad/libres` | `disponibilidad.consultar` |
| HU_30 | Admin | Cambiar el estado de una franja de disponibilidad | `/horarios (clic en la franja)` | `PATCH /api/disponibilidad/:id/estado` | `disponibilidad.cambiar_estado` |

## Venta – Órdenes · Gestión de Clientes

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_31 | Admin | Registrar un cliente | `/clientes (Registrar cliente)` | `POST /api/clientes` | `clientes.registrar` |
| HU_32 | Admin | Buscar un cliente | `/clientes (buscador)` | `GET /api/clientes?q=` | `clientes.buscar` |
| HU_33 | Admin | Listar los clientes | `/clientes` | `GET /api/clientes` | `clientes.listar` |
| HU_34 | Admin | Editar un cliente | `/clientes/:id (Editar)` | `PUT /api/clientes/:id` | `clientes.editar` |
| HU_35 | Admin | Ver el detalle de un cliente | `/clientes/:id (historial de cotizaciones y órdenes)` | `GET /api/clientes/:id` | `clientes.ver_detalle` |
| HU_83 | Admin | Cambiar el estado de un cliente | `/clientes (badge de estado)` | `PATCH /api/clientes/:id/estado` | `clientes.cambiar_estado` |

## Venta – Órdenes · Gestión de Cotizaciones

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_36 | Admin | Registrar una cotización | `/cotizaciones/nueva (maestro-detalle)` | `POST /api/cotizaciones` | `cotizaciones.registrar` |
| HU_37 | Admin | Buscar una cotización | `/cotizaciones (buscador, estado, origen, fechas)` | `GET /api/cotizaciones?q=&estado=&origen=&desde=&hasta=` | `cotizaciones.buscar` |
| HU_38 | Admin | Listar las cotizaciones | `/cotizaciones` | `GET /api/cotizaciones` | `cotizaciones.listar` |
| HU_39 | Admin | Editar una cotización | `/cotizaciones/:id/editar` | `PUT /api/cotizaciones/:id` | `cotizaciones.editar` |
| HU_81 | Admin | Enviar la cotización al cliente | `/cotizaciones/:id (Enviar al cliente)` | `POST /api/cotizaciones/:id/enviar` | `cotizaciones.enviar` |
| HU_40 | Admin | Registrar la aprobación o el rechazo de una cotización | `/cotizaciones/:id (Registrar aprobación / rechazo)` | `POST /api/cotizaciones/:id/decision` | `cotizaciones.registrar_decision` |
| HU_41 | Admin | Ver el detalle de una cotización | `/cotizaciones/:id` | `GET /api/cotizaciones/:id` | `cotizaciones.ver_detalle` |
| HU_78 | Cliente | Solicitar los servicios que necesito | `/portal/catalogo → /portal/solicitar` | `POST /api/portal/solicitudes` | `portal.solicitar_servicios` |
| HU_79 | Cliente | Consultar mis cotizaciones | `/portal/cotizaciones · /portal/cotizaciones/:id` | `GET /api/portal/cotizaciones(/:id)` | `portal.consultar_cotizaciones` |
| HU_80 | Cliente | Aprobar o rechazar mi cotización | `/portal/cotizaciones/:id (Aprobar / Rechazar)` | `POST /api/portal/cotizaciones/:id/decision` | `portal.decidir_cotizacion` |

## Venta – Órdenes · Gestión de Órdenes de Servicio

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_44 | Admin | Registrar una orden de servicio | `/ordenes/nueva · /cotizaciones/:id (Generar orden)` | `POST /api/ordenes · GET /api/ordenes/cotizaciones-aprobadas` | `ordenes.registrar` |
| HU_45 | Admin | Buscar una orden de servicio | `/ordenes (buscador, estado, técnico, fechas)` | `GET /api/ordenes?q=&estado=&tecnico=&desde=&hasta=` | `ordenes.buscar` |
| HU_46 | Admin | Listar las órdenes de servicio | `/ordenes` | `GET /api/ordenes` | `ordenes.listar` |
| HU_47 | Admin | Registrar observaciones en una orden | `/ordenes/:id (Observaciones)` | `PATCH /api/ordenes/:id/observaciones` | `ordenes.registrar_observaciones` |
| HU_48 | Admin | Cambiar el estado de una orden de servicio | `/ordenes/:id (Cambiar estado)` | `PATCH /api/ordenes/:id/estado` | `ordenes.cambiar_estado` |
| HU_49 | Admin | Cambiar el estado de un ítem de la orden | `/ordenes/:id (estado de cada ítem)` | `PATCH /api/ordenes/:id/items/:itemId` | `ordenes.cambiar_estado_item` |
| HU_50 | Admin | Ver el detalle de una orden de servicio | `/ordenes/:id (ítems, reporte técnico, visitas, venta, historial)` | `GET /api/ordenes/:id` | `ordenes.ver_detalle` |
| HU_82 | Cliente | Consultar mis órdenes de servicio | `/portal/ordenes · /portal/ordenes/:id` | `GET /api/portal/ordenes(/:id)` | `portal.consultar_ordenes` |

## Venta – Órdenes · Agendamiento

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_51 | Admin | Agendar una visita técnica | `/agenda (Agendar visita) · /ordenes/:id (Agendar visita)` | `POST /api/agenda · GET /api/agenda/ordenes` | `agenda.agendar` |
| HU_52 | Admin | Consultar el calendario de visitas | `/agenda (mes, semana, lista)` | `GET /api/agenda?desde=&hasta=&tecnico=&estado=` | `agenda.consultar` |
| HU_53 | Admin | Reprogramar o reasignar una visita técnica | `/agenda (detalle de la visita → Reprogramar)` | `POST /api/agenda/:id/reprogramar` | `agenda.reprogramar` |
| HU_54 | Admin | Cambiar el estado de una visita técnica | `/agenda (Marcar cumplida / Cancelar visita)` | `PATCH /api/agenda/:id/estado` | `agenda.cambiar_estado` |

## Venta – Órdenes · Gestión de Ventas

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_55 | Admin | Registrar la venta de una orden | `/ventas (Registrar venta) · /ordenes/:id` | `POST /api/ventas · GET /api/ventas/ordenes-sin-venta` | `ventas.registrar` |
| HU_56 | Admin | Consultar el estado de pago de una orden | `/ventas · /ventas/:id` | `GET /api/ventas · GET /api/ventas/:id · GET /api/ventas/orden/:ordenId` | `ventas.consultar_estado` |
| HU_57 | Admin | Cambiar el estado de pago de una venta | `/ventas/:id (Anular venta)` | `PATCH /api/ventas/:id/estado` | `ventas.cambiar_estado` |

## Venta – Órdenes · Gestión de Abonos

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_58 | Admin | Registrar un abono | `/abonos (Registrar abono) · /ordenes/:id · /ventas/:id` | `POST /api/abonos · GET /api/abonos/ventas-con-saldo` | `abonos.registrar` |
| HU_59 | Admin | Listar los abonos | `/abonos` | `GET /api/abonos` | `abonos.listar` |

## Dashboard · Reportes Operacionales

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_60 | Admin | Generar un reporte de órdenes de servicio | `/reportes (Órdenes de servicio)` | `GET /api/reportes/ordenes` | `reportes.ordenes` |
| HU_61 | Admin | Generar un reporte de servicios prestados por técnico | `/reportes (Servicios por técnico)` | `GET /api/reportes/tecnicos` | `reportes.tecnicos` |
| HU_62 | Admin | Exportar reportes del sistema | `/reportes (Exportar PDF / Excel)` | `— (se genera en el navegador)` | `reportes.exportar` |

## Dashboard · Indicadores de Gestión

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_63 | Admin | Visualizar los indicadores de servicios realizados y órdenes por estado | `/indicadores` | `GET /api/indicadores/servicios-ordenes` | `indicadores.servicios_ordenes` |
| HU_64 | Admin | Visualizar los servicios más solicitados y los técnicos con mayor número de servicios ejecutados | `/indicadores` | `GET /api/indicadores/mas-solicitados` | `indicadores.mas_solicitados` |

## Dashboard · Estadísticas

| HU | Rol | Historia | Pantalla | API | Permiso |
|---|---|---|---|---|---|
| HU_65 | Admin | Visualizar las estadísticas generales del sistema | `/panel` | `GET /api/estadisticas` | `estadisticas.consultar` |

## Aplicación móvil del técnico (se conecta a esta API)

La app móvil inicia sesión con el canal `movil`; la API solo lo acepta si la cuenta tiene el permiso `movil.acceso` y está vinculada a un técnico activo. El token lleva el canal y la versión de sesión: cerrar sesión, restablecer la contraseña o inactivar al técnico lo invalida al instante.

| HU móvil | Subproceso | Historia | API | Permiso |
|---|---|---|---|---|
| HU_01 | Acceso Móvil | Iniciar sesión desde mi dispositivo móvil | `POST /api/auth/login con {"canal":"movil"}` | `movil.acceso` |
| HU_02 | Acceso Móvil | Cerrar sesión desde mi dispositivo móvil | `POST /api/auth/logout` | `movil.acceso` |
| HU_06 | Reporte Técnico | Registrar el diagnóstico del equipo atendido | `PUT /api/movil/ordenes/:id/diagnostico` | `movil.reporte_tecnico` |
| HU_07 | Reporte Técnico | Registrar los materiales utilizados durante el servicio | `POST · GET /api/movil/ordenes/:id/materiales` | `movil.reporte_tecnico` |
| HU_08 | Reporte Técnico | Registrar la solución aplicada al problema | `PUT /api/movil/ordenes/:id/solucion` | `movil.reporte_tecnico` |
| HU_11 | Reporte Técnico | Solicitar una recotización cuando el servicio requiera un repuesto | `POST /api/movil/ordenes/:id/recotizacion` | `movil.solicitar_recotizacion` |
| HU_03 | Seguimiento de Órdenes | Consultar mis órdenes asignadas desde el móvil | `GET /api/movil/ordenes · GET /api/movil/ordenes/:id` | `movil.consultar_ordenes` |
| HU_04 | Seguimiento de Órdenes | Registrar el inicio de una visita técnica | `POST /api/movil/visitas/:id/inicio` | `movil.registrar_visita` |
| HU_05 | Seguimiento de Órdenes | Registrar la finalización de una visita técnica | `POST /api/movil/visitas/:id/fin` | `movil.registrar_visita` |
| HU_09 | Seguimiento de Órdenes | Actualizar el estado de una orden desde el móvil | `PATCH /api/movil/ordenes/:id/estado · PATCH /api/movil/ordenes/:id/items/:itemId` | `movil.actualizar_estado` |
| HU_10 | Seguimiento de Órdenes | Consultar el historial de una orden desde el móvil | `GET /api/movil/ordenes/:id/historial` | `movil.consultar_historial` |

## Verificación

- `api/pruebas/flujo-completo.mjs` — 147 comprobaciones del flujo de la ficha técnica (solicitud → cotización → orden → venta → abonos → visita → móvil → recotización).
- `api/pruebas/complementos.mjs` — 131 comprobaciones de los casos restantes (reprogramar y cancelar visitas, bloquear franjas, anular ventas, confirmaciones, cierre de sesiones, móvil).
- Ambas corren contra una base recién montada: `montar-base.bat` con datos de demostración y luego `node pruebas/flujo-completo.mjs` dentro de `api`.
