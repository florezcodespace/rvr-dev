# Revisión del portal contra la base de datos · 24 de septiembre de 2026

Revisión a fondo del portal contra el modelo de 15 tablas, y plan para lo que
pediste: **que el cliente haga todo desde la web** (registrarse, ver servicios,
solicitar, cotizar, pagar y seguir su orden), **ver la información a fondo** y
**poder editar** usuarios, clientes y demás.

---

## 1. Cómo está hoy

| Módulo | Datos | Qué se puede hacer | Qué falta |
|---|---|---|---|
| Dashboard | Base real | Ver indicadores | — |
| Órdenes | Base real | Listar, filtrar, crear, cambiar estado, asignar técnico | **No hay detalle de la orden**; no se edita una orden ya creada |
| Clientes | Base real | Listar, crear, activar/desactivar | **No hay detalle ni edición** |
| Técnicos | Base real | Listar, crear, cambiar estado | **No hay detalle ni edición**; habilidades no se guardan |
| Servicios | Base real | Listar, crear, publicar/archivar | **No hay detalle ni edición** (ni precio ni garantía) |
| Pagos | Base real | Listar, registrar, conciliar | **No hay detalle**; no se ve la venta completa |
| Usuarios | Base real | Listar, crear, cambiar rol y estado | **No se edita nombre, correo ni teléfono**; no se restablece contraseña |
| Cotizaciones | Datos de prueba | Nada real | **No tiene tablas en la base** |
| Reportes | Datos de prueba | Nada real | Se puede rehacer con las consultas de KPIs, sin tablas nuevas |
| Buscador global | Datos de prueba | Busca sobre datos inventados | Debe buscar en la base |
| Notificaciones | Datos de prueba | Campana decorativa | Debe salir de hechos reales |
| Configuración | Local | Preferencias del portal | Incluye una integración de **WhatsApp** que sobra |

**Lo más importante:** hoy el portal es un portal **interno**. El cliente no
tiene dónde entrar. Todo lo que pides —registro, solicitud, cotización, pago y
seguimiento— es un **portal del cliente** que todavía no existe.

---

## 2. Qué falta en la base para lo que pides

Estas son las tablas y columnas que hacen falta. **Ninguna se toca sin tu visto
bueno**, como acordamos.

### Tablas nuevas (4)

**`cotizaciones`** — el subproceso está en la ficha técnica y hoy no existe.
`id` · `cliente_id` → clientes · `orden_id` → ordenes_servicio (nulo hasta que
se aprueba) · `creada_por` → usuarios · `estado` (borrador, enviada, aprobada,
rechazada, vencida) · `validez_hasta` · `observaciones` · `total` (calculado del
detalle) · `fecha_creacion` · `fecha_respuesta`

**`cotizacion_detalle`** — `cotizacion_id` · `servicio_id` · `cantidad` ·
`precio_unitario` · `dias_garantia` · `subtotal`. Mismo criterio que la orden:
el precio se **copia**, así una cotización vieja no cambia de valor.

**`historial_estados`** — quién cambió qué y cuándo (orden o cotización):
`id` · `entidad` (orden/cotizacion) · `entidad_id` · `estado_anterior` ·
`estado_nuevo` · `usuario_id` · `nota` · `fecha`. Es lo que llena la pestaña de
historial en el detalle, y es la prueba de que el proceso se siguió.

**`notificaciones`** — `id` · `usuario_id` · `tipo` · `titulo` · `detalle` ·
`enlace` · `leida` · `fecha`. Es lo que hace que el cliente se entere de que su
cotización está lista sin que nadie le escriba por WhatsApp.

### Columnas nuevas (3)

- `ordenes_servicio.origen` (portal_cliente / interno): saber qué entró solo y
  qué tuvo que digitar alguien. Es la medida de que la automatización sirve.
- `ordenes_servicio.cotizacion_id`: de dónde salió la orden. *(Alternativa a
  `cotizaciones.orden_id`; se usa una de las dos, no las dos.)*
- `abonos.registrado_por` → usuarios: distingue el pago que reportó el cliente
  del que registró facturación. Sin esto no se sabe a quién reclamarle si el
  soporte no aparece.

### Lo que **no** hace falta tocar

`clientes` ya tiene `usuario_id` opcional: el registro del cliente solo lo
llena. Órdenes, detalle, agendamientos, ventas y abonos ya soportan todo el
flujo. Las contraseñas ya están cifradas.

---

## 3. Módulos: qué se queda, qué entra y qué sale

### Portal interno (lo que ya existe)

Se queda todo y se completa: Dashboard, Órdenes, Cotizaciones (ahora real),
Clientes, Técnicos, Servicios, Pagos, Usuarios, Reportes (ahora real),
Configuración.

### Portal del cliente (nuevo)

Mismo inicio de sesión; según el rol, el menú cambia. El cliente entra y ve
**solo lo suyo**:

| Pantalla | Qué hace |
|---|---|
| Catálogo de servicios | Los servicios publicados, con precio y garantía |
| Solicitar servicio | Elige servicios, dirección y describe el problema → crea su orden en estado *nueva* |
| Mis cotizaciones | Ve la cotización, la **aprueba o la rechaza**; al aprobar se genera la orden |
| Mis órdenes | Estado, técnico, visita programada, diagnóstico y garantía |
| Mis pagos | Saldo, historial y **reportar un pago** (medio + referencia) |
| Mi perfil | Sus datos de contacto y su dirección |

### Qué sale

- **La integración de WhatsApp en Configuración.** Es justo lo que estás
  reemplazando.
- **El botón de la landing que abre el correo** para pedir cotización: pasa a
  ser *Crear cuenta y solicitar en línea*.
- Nada más se elimina.

---

## 4. Pantallas de detalle y edición

**Detalle** (una página por registro, con pestañas):

- **Orden** `/ordenes/:id` — servicios cobrados y total, visitas, diagnósticos,
  venta y pagos, garantía vigente, historial de estados.
- **Cliente** `/clientes/:id` — datos, sus órdenes, facturación, saldo, pagos.
- **Técnico** `/tecnicos/:id` — agenda, órdenes asignadas, cumplimiento.
- **Servicio** `/servicios/:id` — precio, garantía, en cuántas órdenes va.
- **Pago** `/pagos/:id` — venta y orden a la que pertenece, quién lo registró.

**Edición** (botón *Editar* en cada listado y en cada detalle):

- Usuario: nombre, correo, teléfono, rol, estado y **restablecer contraseña**
  (genera una temporal como en el alta).
- Cliente: nombre, documento, contacto, dirección, ciudad, sector.
- Técnico: especialidad, zona, estado y teléfono.
- Servicio: nombre, descripción, categoría, precio y días de garantía.
- Orden: dirección, descripción, servicios del detalle y fecha de visita.

---

## 5. Lo que no se puede hacer aquí (y qué se hace en cambio)

- **Cobrar con tarjeta o PSE de verdad** necesita una pasarela (Wompi,
  Mercado Pago, PayU): cuenta de empresa, dominio con HTTPS y llaves. Para el
  proyecto, el cliente **reporta** el pago (medio + referencia) y facturación lo
  concilia: el registro en la base es el mismo. Si consigues cuenta de pruebas
  de una pasarela, se conecta después sin cambiar el modelo.
- **Enviar correos** (avisos, recuperación de contraseña) necesita un servicio
  de correo. Por eso los avisos van a la campana del portal, dentro de la web.
- **Subir fotos** (evidencias, comprobantes) necesita almacenamiento de
  archivos; queda para después, con `evidencias` como tabla propia.

---

## 6. Plan por etapas

**Etapa 1 — sin tocar la base** *(se puede empezar ya)*
Detalle de orden, cliente, técnico, servicio y pago · edición de usuarios,
clientes, técnicos y servicios · restablecer contraseña · Reportes con datos
reales · buscador global contra la base · quitar WhatsApp de Configuración.

**Etapa 2 — cotizaciones** *(cambia la base)*
Tablas `cotizaciones` y `cotizacion_detalle` · módulo real: crear, enviar,
aprobar, rechazar · al aprobar se genera la orden con su detalle.

**Etapa 3 — portal del cliente** *(cambia la base)*
Registro público · menú por rol · catálogo, solicitar servicio, mis órdenes,
mis cotizaciones, mis pagos, mi perfil · `origen` en la orden.

**Etapa 4 — automatizar avisos e historial** *(cambia la base)*
`notificaciones` e `historial_estados` · campana real · el cliente se entera de
cada cambio sin que nadie escriba · el detalle muestra la trazabilidad.

Cada etapa deja el portal funcionando. Si el tiempo alcanza para dos, la 1 y la
3 son las que más se notan en la sustentación.
