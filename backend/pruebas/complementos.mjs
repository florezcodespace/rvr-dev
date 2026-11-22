/**
 * Segunda prueba de humo: los casos de uso que flujo-completo.mjs no recorre
 * (reprogramar y cancelar visitas, bloquear franjas, anular ventas, editar e
 * inactivar con confirmación, cierre de sesión del móvil, listados y opciones).
 * Corre contra una base recién montada (01 + 02 + 99).
 *
 *   node pruebas/complementos.mjs            (API en http://localhost:4000/api)
 */
const API = process.env.API ?? 'http://localhost:4000/api'
let fallos = 0
let pasos = 0

async function pedir(metodo, ruta, { token, cuerpo, esperado } = {}) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const texto = await r.text()
  const datos = texto ? JSON.parse(texto) : null
  pasos++
  const bien = esperado ? r.status === esperado : r.ok
  if (!bien) {
    fallos++
    console.log(`✗ ${metodo} ${ruta} → ${r.status}`, JSON.stringify(datos).slice(0, 300))
  }
  return { estado: r.status, datos }
}
const ok = (condicion, texto) => {
  pasos++
  if (!condicion) { fallos++; console.log('✗', texto) } else console.log('✓', texto)
}
const f = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
const unico = Date.now().toString().slice(-6)
const login = async (usuario, contrasena, canal) =>
  (await pedir('POST', '/auth/login', { cuerpo: { usuario, contrasena, ...(canal ? { canal } : {}) } })).datos

const A = (await login('rvargas', 'RvR2026*admin')).token
const COORD = (await login('lgomez', 'RvR2026*coord')).token

// ---------------------------------------------------------------- listados y opciones
for (const ruta of ['/abonos', '/abonos/ventas-con-saldo', '/ventas', '/ventas/ordenes-sin-venta', '/ordenes/cotizaciones-aprobadas',
  '/tecnicos/opciones', '/tecnicos/especialidades', '/clientes/opciones?q=ana', '/servicios/categorias', '/agenda/ordenes',
  '/accesos', '/cotizaciones?estado=pendiente', '/usuarios?rol=2', '/permisos/modulos', `/agenda?desde=${f(new Date())}&hasta=${f(new Date(Date.now() + 14 * 864e5))}`]) {
  const r = await pedir('GET', ruta, { token: A })
  ok(r.estado === 200, `GET ${ruta}`)
}
const aprobadas = (await pedir('GET', '/ordenes/cotizaciones-aprobadas', { token: A })).datos
ok(Array.isArray(aprobadas) ? aprobadas.length >= 1 : (aprobadas.items ?? []).length >= 1, 'HU_44 hay una cotización aprobada esperando orden (datos demo)')

// ---------------------------------------------------------------- permisos del coordinador
await pedir('GET', '/roles', { token: COORD, esperado: 403 })
await pedir('GET', '/cotizaciones', { token: COORD })
ok(true, 'RNF-021 el coordinador opera ventas pero no configuración')

// ---------------------------------------------------------------- clientes
const cli = (await pedir('POST', '/clientes', { token: A, cuerpo: {
  documento: `7${unico}1`, nombres: 'Lucía', apellidos: 'Prueba', telefono: '3201234567', direccion: 'Cl 1 # 2-3', correo: `lucia${unico}@gmail.com`,
}, esperado: 201 })).datos
const cliId = cli.id ?? cli.cliente?.id
ok(cliId > 0, 'HU_31 cliente registrado')
await pedir('POST', '/clientes', { token: A, cuerpo: { documento: `7${unico}1`, nombres: 'Otro', apellidos: 'Igual', telefono: '3200000000' }, esperado: 409 })
ok(true, 'CA_31_02 documento duplicado rechazado')
const edit = await pedir('PUT', `/clientes/${cliId}`, { token: A, cuerpo: {
  documento: `7${unico}1`, nombres: 'Lucía María', apellidos: 'Prueba', telefono: '3201234567', direccion: 'Cl 9 # 9-9', correo: `lucia${unico}@gmail.com`,
} })
ok(edit.estado === 200, 'HU_34 cliente editado')

// ---------------------------------------------------------------- servicios
const srv = (await pedir('GET', '/servicios?q=impresora', { token: A })).datos.items[0]
const srvEd = await pedir('PUT', `/servicios/${srv.id}`, { token: A, cuerpo: { nombre: srv.nombre, categoria: srv.categoria, precioBase: srv.precioBase + 5000, descripcion: srv.descripcion } })
ok(srvEd.estado === 200 && srvEd.datos.precioBase === srv.precioBase + 5000, 'HU_18 servicio editado (precio nuevo solo para cotizaciones nuevas)')
await pedir('PATCH', `/servicios/${srv.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' } })
const publico = (await pedir('GET', '/publico/servicios')).datos.items
ok(!publico.some((s) => s.id === srv.id), 'CA_19_02 servicio inactivo sale del catálogo público')
await pedir('PATCH', `/servicios/${srv.id}/estado`, { token: A, cuerpo: { estado: 'activo' } })

// ---------------------------------------------------------------- usuarios
const u = (await pedir('GET', '/usuarios?q=lgomez', { token: A })).datos.items[0]
const uEd = await pedir('PUT', `/usuarios/${u.id}`, { token: A, cuerpo: {
  nombreUsuario: u.nombreUsuario, correo: u.correo, nombres: u.nombres, apellidos: u.apellidos, telefono: '3009998877', rolId: u.rol.id,
} })
ok(uEd.estado === 200, 'HU_10 usuario editado')
const reset = await pedir('POST', `/usuarios/${u.id}/contrasena`, { token: A })
ok(/^RvR-/.test(reset.datos?.contrasenaTemporal ?? ''), 'Admin restablece contraseña con clave temporal')
await pedir('GET', '/cotizaciones', { token: COORD, esperado: 401 })
ok(true, 'La sesión anterior del usuario queda invalidada al restablecer')
const yo = (await pedir('GET', '/usuarios?q=rvargas', { token: A })).datos.items[0]
const auto = await pedir('PATCH', `/usuarios/${yo.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' }, esperado: 422 })
ok(auto.datos.codigo === 'AUTOBLOQUEO', 'CA_11 no puedes inactivarte a ti mismo')

// ---------------------------------------------------------------- técnicos
const tecs = (await pedir('GET', '/tecnicos?estado=activo', { token: A })).datos.items
const conVisitas = tecs.find((t) => t.visitasPendientes > 0)
const pide = await pedir('PATCH', `/tecnicos/${conVisitas.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' }, esperado: 409 })
ok(pide.datos.codigo === 'CONFIRMAR_CAMBIO', 'CA_26_02 advierte las visitas pendientes antes de inactivar')
const sinCuenta = tecs.find((t) => !t.cuentaMovil)
const cuenta = await pedir('POST', `/tecnicos/${sinCuenta.id}/cuenta`, { token: A, esperado: 201 })
ok(cuenta.datos?.cuenta?.contrasenaTemporal || cuenta.datos?.contrasenaTemporal, 'HU_22 crear cuenta móvil a un técnico existente')
const tEd = await pedir('PUT', `/tecnicos/${sinCuenta.id}`, { token: A, cuerpo: {
  documento: sinCuenta.documento, nombres: sinCuenta.nombres, apellidos: sinCuenta.apellidos, especialidad: 'Redes y cámaras', telefono: sinCuenta.telefono, correo: sinCuenta.correo,
} })
ok(tEd.estado === 200, 'HU_25 técnico editado')

// ---------------------------------------------------------------- disponibilidad
const man = f(new Date(Date.now() + 2 * 864e5))
const franjas = (await pedir('GET', `/disponibilidad?desde=${man}&hasta=${man}`, { token: A })).datos
const lista = Array.isArray(franjas) ? franjas : franjas.items
const libre = lista.find((x) => x.estado === 'disponible')
const sinMotivo = await pedir('PATCH', `/disponibilidad/${libre.id}/estado`, { token: A, cuerpo: { estado: 'bloqueada' }, esperado: 422 })
ok(sinMotivo.datos.codigo === 'MOTIVO_REQUERIDO', 'HU_30 bloquear exige el motivo')
const bloq = await pedir('PATCH', `/disponibilidad/${libre.id}/estado`, { token: A, cuerpo: { estado: 'bloqueada', motivo: 'Cita médica' } })
ok(bloq.datos.estado === 'bloqueada', 'HU_30 franja bloqueada')
const libres = (await pedir('GET', `/disponibilidad/libres?fecha=${man}`, { token: A })).datos
ok(!libres.some((x) => x.id === libre.id), 'CA_30 una franja bloqueada no se ofrece para agendar')
await pedir('PATCH', `/disponibilidad/${libre.id}/estado`, { token: A, cuerpo: { estado: 'disponible' } })

// ---------------------------------------------------------------- agenda: reprogramar y cancelar
const agendables = (await pedir('GET', '/agenda/ordenes', { token: A })).datos
const ord = (Array.isArray(agendables) ? agendables : agendables.items)[0]
const disp = (await pedir('GET', `/disponibilidad/libres?fecha=${man}`, { token: A })).datos
const v = (await pedir('POST', '/agenda', { token: A, cuerpo: { ordenId: ord.id, disponibilidadId: disp[0].id }, esperado: 201 })).datos
const otra = disp.find((x) => x.tecnicoId !== disp[0].tecnicoId) ?? disp[1]
const rep = await pedir('POST', `/agenda/${v.id}/reprogramar`, { token: A, cuerpo: { disponibilidadId: otra.id, notas: 'Cliente pidió cambio' } })
ok(rep.estado === 200 && rep.datos.id !== v.id, 'HU_53 visita reprogramada/reasignada (nueva visita)')
const vieja = (await pedir('GET', `/agenda?desde=${man}&hasta=${man}`, { token: A })).datos
const listaV = Array.isArray(vieja) ? vieja : vieja.items
ok(listaV.some((x) => x.id === v.id && x.estado === 'reprogramada'), 'CA_53_04 la visita anterior queda «reprogramada»')
const libresTras = (await pedir('GET', `/disponibilidad/libres?fecha=${man}`, { token: A })).datos
ok(libresTras.some((x) => x.id === disp[0].id), 'CA_53_03 la franja anterior se libera')
const canc = await pedir('PATCH', `/agenda/${rep.datos.id}/estado`, { token: A, cuerpo: { estado: 'cancelada', notas: 'Sin acceso al sitio' } })
ok(canc.datos.estado === 'cancelada', 'HU_54 visita cancelada')
const libresTras2 = (await pedir('GET', `/disponibilidad/libres?fecha=${man}`, { token: A })).datos
ok(libresTras2.some((x) => x.id === otra.id), 'CA_54_02 al cancelar se libera la franja')
await pedir('PATCH', `/agenda/${rep.datos.id}/estado`, { token: A, cuerpo: { estado: 'pendiente' }, esperado: 422 })
ok(true, 'Una visita cerrada no vuelve a pendiente')

// ---------------------------------------------------------------- órdenes: observaciones, ítems, estado
const obs = await pedir('PATCH', `/ordenes/${ord.id}/observaciones`, { token: A, cuerpo: { observaciones: 'Portería exige cédula.' } })
ok(obs.estado === 200, 'HU_47 observaciones registradas')
const det = (await pedir('GET', `/ordenes/${ord.id}`, { token: A })).datos
const item = det.items[0]
const it = await pedir('PATCH', `/ordenes/${ord.id}/items/${item.id}`, { token: A, cuerpo: { estado: 'en_proceso' } })
ok(it.estado === 200, 'HU_49 estado de ítem cambiado')
const hist = (await pedir('GET', `/ordenes/${ord.id}`, { token: A })).datos.historial
ok(hist.length >= 2, 'CA_48 el historial registra los cambios')
const malo = await pedir('PATCH', `/ordenes/${ord.id}/estado`, { token: A, cuerpo: { estado: 'finalizada' }, esperado: 422 })
ok(['TRANSICION_INVALIDA', 'REPORTE_INCOMPLETO'].includes(malo.datos.codigo), 'CA_48 transición inválida rechazada')

// ---------------------------------------------------------------- ventas: anular
const ventas = (await pedir('GET', '/ventas?estado=pendiente_anticipo', { token: A })).datos.items
const vt = ventas[0]
const an = await pedir('PATCH', `/ventas/${vt.id}/estado`, { token: A, cuerpo: { estado: 'anulada', motivo: 'Cliente desistió' } })
ok(an.datos.estadoPago === 'anulada' && an.datos.saldo === 0, 'HU_57 venta anulada con saldo en cero')
await pedir('PATCH', `/ventas/${vt.id}/estado`, { token: A, cuerpo: { estado: 'anulada' }, esperado: 422 })
await pedir('POST', '/abonos', { token: A, cuerpo: { ventaId: vt.id, monto: 1000, tipoAbono: 'anticipo', metodoPago: 'Efectivo' }, esperado: 422 })
ok(true, 'CA_58 no se abona a una venta anulada')

// ---------------------------------------------------------------- cotización registrada por el admin + rechazo
const cot = (await pedir('POST', '/cotizaciones', { token: A, cuerpo: {
  clienteId: cliId, descripcion: 'Red lenta', items: [{ tipo: 'servicio', servicioId: 1, cantidad: 2 }, { tipo: 'repuesto', descripcion: 'Switch 8 puertos', cantidad: 1, precioUnitario: 120000 }],
}, esperado: 201 })).datos
ok(cot.montoTotal > 120000, 'HU_36 cotización maestro-detalle con subtotal y total')
await pedir('POST', `/cotizaciones/${cot.id}/enviar`, { token: A })
const rech = await pedir('POST', `/cotizaciones/${cot.id}/decision`, { token: A, cuerpo: { decision: 'rechazada', motivo: 'Presupuesto' } })
ok(rech.datos.estado === 'rechazada', 'HU_40 rechazo registrado por el administrador')

// ---------------------------------------------------------------- perfil propio y cierre de sesiones
const perf = await pedir('PUT', '/auth/perfil', { token: A, cuerpo: { nombres: 'Ricardo', apellidos: 'Vargas', telefono: '3015270761', correo: 'ricardo.vargas@rvrtec.co' } })
ok(perf.estado === 200, 'Autogestión: actualizar mis datos')
const otraSesion = (await login('rvargas', 'RvR2026*admin')).token
await pedir('POST', '/auth/logout-todo', { token: otraSesion })
await pedir('GET', '/roles', { token: A, esperado: 401 })
ok(true, 'Cerrar sesión en todos los dispositivos invalida los tokens')
const A2 = (await login('rvargas', 'RvR2026*admin')).token

// ---------------------------------------------------------------- móvil
const T = (await login('jmora', 'RvR2026*tecnico', 'movil'))
ok(T?.token, 'Móvil HU_01 técnico entra por el canal móvil')
const web = await pedir('POST', '/auth/login', { cuerpo: { usuario: 'jmora', contrasena: 'RvR2026*tecnico' }, esperado: 403 })
ok(web.datos.codigo === 'USAR_APP_MOVIL', 'El técnico no entra al portal web')
const mias = (await pedir('GET', '/movil/ordenes', { token: T.token })).datos
const lista2 = Array.isArray(mias) ? mias : mias.items
ok(lista2.length > 0, 'Móvil HU_03 órdenes asignadas')
const detM = (await pedir('GET', `/movil/ordenes/${lista2[0].ordenId}`, { token: T.token })).datos
ok(detM.items?.length > 0, 'Móvil detalle con ítems')
const ajena = (await pedir('GET', '/ordenes?estado=finalizada', { token: A2 })).datos.items.find((o) => !lista2.some((m) => m.ordenId === o.id))
if (ajena) {
  await pedir('GET', `/movil/ordenes/${ajena.id}`, { token: T.token, esperado: 404 })
  ok(true, 'Móvil el técnico no ve órdenes de otros')
}
await pedir('POST', '/auth/logout', { token: T.token })
await pedir('GET', '/movil/ordenes', { token: T.token, esperado: 401 })
ok(true, 'Móvil HU_02 cierre de sesión invalida el token')

console.log(`\n${pasos - fallos}/${pasos} comprobaciones correctas`)
process.exit(fallos ? 1 : 0)
