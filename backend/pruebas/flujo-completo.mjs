/**
 * Prueba de humo de la API v6: recorre el flujo completo de la ficha técnica
 * contra una base recién montada (01 + 02 + 99). No es parte del build.
 *
 *   node pruebas/flujo-completo.mjs            (API en http://localhost:4000/api)
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
  const ok = esperado ? r.status === esperado : r.ok
  if (!ok) {
    fallos++
    console.log(`✗ ${metodo} ${ruta} → ${r.status}`, JSON.stringify(datos).slice(0, 300))
  }
  return { estado: r.status, datos }
}

const ok = (condicion, texto) => {
  pasos++
  if (!condicion) { fallos++; console.log('✗', texto) } else console.log('✓', texto)
}

const hoy = new Date()
const f = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
const unico = Date.now().toString().slice(-6)

// ------------------------------------------------------------ acceso
const admin = (await pedir('POST', '/auth/login', { cuerpo: { usuario: 'rvargas', contrasena: 'RvR2026*admin' } })).datos
ok(admin?.usuario?.tipo === 'administrativo', 'HU_13 login por nombre de usuario → portal administrativo')
const A = admin.token

const tecnicoWeb = await pedir('POST', '/auth/login', { cuerpo: { usuario: 'julian.mora@rvrtec.co', contrasena: 'RvR2026*tecnico' }, esperado: 403 })
ok(tecnicoWeb.datos.codigo === 'USAR_APP_MOVIL', 'El técnico no entra a la web: USAR_APP_MOVIL')

for (let i = 0; i < 3; i++) await pedir('POST', '/auth/login', { cuerpo: { usuario: `nadie${unico}@x.co`, contrasena: 'malaClave1' }, esperado: i < 2 ? 401 : 423 })
const bloqueado = await pedir('POST', '/auth/login', { cuerpo: { usuario: `nadie${unico}@x.co`, contrasena: 'malaClave1' }, esperado: 423 })
ok(bloqueado.datos.codigo === 'CUENTA_BLOQUEADA', 'CA_13_05 bloqueo tras 3 intentos fallidos')

// ---------------------------------------------------------- roles y permisos
const catalogo = (await pedir('GET', '/permisos/catalogo', { token: A })).datos
ok(catalogo.length >= 16, `Catálogo de permisos agrupado por módulo (${catalogo.length} módulos)`)
const idsClientes = catalogo.find((g) => g.modulo === 'clientes').permisos.map((p) => p.id)
const sinPermisos = await pedir('POST', '/roles', { token: A, cuerpo: { nombre: `Vacío ${unico}`, permisos: [] }, esperado: 422 })
ok(sinPermisos.datos.codigo === 'SIN_PERMISOS', 'CA_01_04 rol sin permisos rechazado')
const rol = (await pedir('POST', '/roles', { token: A, cuerpo: { nombre: `Recepción ${unico}`, descripcion: 'Atiende clientes', permisos: idsClientes } , esperado: 201 })).datos
ok(rol.permisos === idsClientes.length, 'HU_01 rol registrado con permisos')
await pedir('POST', '/roles', { token: A, cuerpo: { nombre: `recepción ${unico}`, permisos: idsClientes }, esperado: 409 })
const rolEd = (await pedir('PUT', `/roles/${rol.id}`, { token: A, cuerpo: { nombre: rol.nombre, descripcion: 'Editado', permisos: idsClientes.slice(0, 2) } })).datos
ok(rolEd.permisos === 2, 'HU_04 rol editado')
ok((await pedir('GET', `/roles?q=recepcion ${unico}`, { token: A })).datos.total === 1, 'HU_02 buscar rol sin tildes')
const permisoNuevo = (await pedir('POST', '/permisos', { token: A, cuerpo: { nombre: `exportar_${unico}`, modulo: 'clientes', descripcion: 'Prueba' }, esperado: 201 })).datos
ok(permisoNuevo.estado === 'activo', 'HU_66 permiso registrado')
await pedir('POST', '/permisos', { token: A, cuerpo: { nombre: `exportar_${unico}`, modulo: 'clientes' }, esperado: 409 })
const permUsado = catalogo.find((g) => g.modulo === 'clientes').permisos[0]
const confirmar = await pedir('PUT', `/permisos/${permUsado.id}`, { token: A, cuerpo: { nombre: permUsado.nombre, modulo: 'clientes', descripcion: permUsado.descripcion }, esperado: 409 })
ok(confirmar.datos.codigo === 'CONFIRMAR_CAMBIO', 'CA_69_03 advierte antes de editar un permiso en roles activos')
await pedir('PATCH', `/permisos/${permUsado.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' }, esperado: 422 })
await pedir('PATCH', `/permisos/${permisoNuevo.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' } })

// ---------------------------------------------------------------- usuarios
const nuevoU = (await pedir('POST', '/usuarios', { token: A, cuerpo: {
  nombreUsuario: `recep${unico}`, correo: `recep${unico}@rvrtec.co`, nombres: 'Marta', apellidos: 'Ríos', telefono: '3001112233', rolId: rol.id,
}, esperado: 201 })).datos
ok(/^RvR-/.test(nuevoU.contrasenaTemporal), 'HU_07 usuario registrado con contraseña temporal')
const rolConUsuario = await pedir('PATCH', `/roles/${rol.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' }, esperado: 422 })
ok(rolConUsuario.datos.codigo === 'ROL_CON_USUARIOS', 'CA_05_02 no se inactiva un rol con usuarios activos')
const recep = (await pedir('POST', '/auth/login', { cuerpo: { usuario: `recep${unico}`, contrasena: nuevoU.contrasenaTemporal } })).datos
await pedir('GET', '/roles', { token: recep.token, esperado: 403 })
ok(true, 'RNF-021 un rol sin permiso recibe 403')
await pedir('PATCH', `/usuarios/${nuevoU.usuario.id}/estado`, { token: A, cuerpo: { estado: 'inactivo' } })
await pedir('GET', '/clientes', { token: recep.token, esperado: 401 })
ok(true, 'CA_11_02 usuario inactivado pierde la sesión')

// ---------------------------------------------------------------- servicios
const srv = (await pedir('POST', '/servicios', { token: A, cuerpo: { nombre: `Revisión UPS ${unico}`, categoria: 'Mantenimiento', precioBase: 70000, descripcion: 'Prueba' }, esperado: 201 })).datos
await pedir('POST', '/servicios', { token: A, cuerpo: { nombre: `Mal ${unico}`, categoria: 'Mantenimiento', precioBase: 0 }, esperado: 422 })
const publico = (await pedir('GET', '/publico/servicios?categoria=Redes')).datos
ok(publico.items.every((s) => s.categoria === 'Redes' && s.estado === 'activo'), 'HU_21 catálogo público filtrado por categoría, sin sesión')

// --------------------------------------------------- técnico y disponibilidad
const tec = (await pedir('POST', '/tecnicos', { token: A, cuerpo: {
  documento: `9${unico}0`, nombres: 'Pedro', apellidos: `Prueba${unico}`, especialidad: 'Redes', telefono: '3100000000',
  correo: `pedro${unico}@rvrtec.co`, crearCuenta: true,
}, esperado: 201 })).datos
ok(tec.cuenta?.contrasenaTemporal, 'HU_22 técnico con cuenta para la app móvil')
const manana = new Date(hoy.getTime() + 86400000)
const dia = f(manana)
await pedir('POST', '/disponibilidad', { token: A, cuerpo: { tecnicoId: tec.tecnico.id, fecha: dia, horaInicio: '08:00', horaFin: '10:00' }, esperado: 201 })
const cruce = await pedir('POST', '/disponibilidad', { token: A, cuerpo: { tecnicoId: tec.tecnico.id, fecha: dia, horaInicio: '09:00', horaFin: '11:00' }, esperado: 422 })
ok(cruce.datos.codigo === 'FRANJA_CRUZADA', 'CA_28_03 franja cruzada rechazada')
await pedir('POST', '/disponibilidad', { token: A, cuerpo: { tecnicoId: tec.tecnico.id, fecha: dia, horaInicio: '11:00', horaFin: '10:00' }, esperado: 422 })

// ------------------------------------------------------ registro del cliente
const doc = `10${unico}`
const reg = await pedir('POST', '/auth/registro', { cuerpo: {
  documento: doc, nombres: 'Lucía', apellidos: 'Prueba', telefono: '3207778899', direccion: 'Cl. 1 # 2-3',
  correo: `lucia${unico}@gmail.com`, contrasena: 'Lucia2026ok', confirmacion: 'Lucia2026ok',
}, esperado: 201 })
ok(reg.datos.nombreUsuario, 'HU_75 registro en el portal')
const cli = (await pedir('POST', '/auth/login', { cuerpo: { usuario: `lucia${unico}@gmail.com`, contrasena: 'Lucia2026ok' } })).datos
ok(cli.usuario.tipo === 'cliente', 'CA_13_03 el cliente entra a su portal')
const C = cli.token
await pedir('GET', '/ordenes', { token: C, esperado: 403 })
const perfil = (await pedir('GET', '/portal/perfil', { token: C })).datos
ok(perfil.documento === doc, 'HU_76 consultar mi perfil')
await pedir('PUT', '/portal/perfil', { token: C, cuerpo: { ...perfil, telefono: '3209990000' } })
await pedir('POST', '/auth/contrasena', { token: C, cuerpo: { actual: 'mala', nueva: 'Lucia2026ok2' }, esperado: 422 })

// ------------------------------------------------ solicitud → cotización
const sol = (await pedir('POST', '/portal/solicitudes', { token: C, cuerpo: {
  items: [{ servicioId: 1, cantidad: 2 }, { servicioId: srv.id, cantidad: 1 }], descripcion: 'Dos equipos lentos y la UPS pita', direccion: 'Cl. 1 # 2-3',
}, esperado: 201 })).datos
const misCots = (await pedir('GET', '/portal/cotizaciones', { token: C })).datos
ok(misCots[0].estado === 'solicitada' && misCots[0].montoTotal === null, 'HU_78/HU_79 solicitud visible sin valores')
const enviarSinValor = await pedir('POST', `/cotizaciones/${sol.id}/enviar`, { token: A, esperado: 422 })
ok(enviarSinValor.datos.codigo === 'SIN_VALORAR', 'CA_81_01 no se envía sin valorar')
const valorada = (await pedir('PUT', `/cotizaciones/${sol.id}`, { token: A, cuerpo: {
  descripcion: 'Dos equipos lentos y la UPS pita', direccion: 'Cl. 1 # 2-3',
  items: [{ tipo: 'servicio', servicioId: 1, cantidad: 2 }, { tipo: 'servicio', servicioId: srv.id, cantidad: 1 },
    { tipo: 'repuesto', descripcion: 'Batería UPS 12V', cantidad: 1, precioUnitario: 95000 }],
} })).datos
ok(valorada.montoTotal === 120000 * 2 + 70000 + 95000, `CA_36_04 total calculado (${valorada.montoTotal})`)
await pedir('POST', `/cotizaciones/${sol.id}/decision`, { token: A, cuerpo: { decision: 'aprobada' }, esperado: 422 })
await pedir('POST', `/cotizaciones/${sol.id}/enviar`, { token: A })
const notifs = (await pedir('GET', '/notificaciones', { token: C })).datos
ok(notifs.noLeidas >= 1, 'CA_81_03 el cliente recibe el aviso')
await pedir('POST', `/portal/cotizaciones/${sol.id}/decision`, { token: C, cuerpo: { decision: 'aprobada' } })
const otraVez = await pedir('POST', `/portal/cotizaciones/${sol.id}/decision`, { token: C, cuerpo: { decision: 'rechazada' }, esperado: 422 })
ok(otraVez.datos.codigo === 'ESTADO_INVALIDO', 'CA_80_05 la decisión no se cambia')
await pedir('PUT', `/cotizaciones/${sol.id}`, { token: A, cuerpo: { items: [{ tipo: 'servicio', servicioId: 1, cantidad: 1 }] }, esperado: 422 })

// ---------------------------------------------------------------- orden
const orden = (await pedir('POST', '/ordenes', { token: A, cuerpo: { cotizacionId: sol.id }, esperado: 201 })).datos
ok(orden.estado === 'esperando_anticipo' && orden.items.length === 3, `HU_44 orden ${orden.codigo} con 3 ítems`)
await pedir('POST', '/ordenes', { token: A, cuerpo: { cotizacionId: sol.id }, esperado: 422 })
const sinAnt = await pedir('PATCH', `/ordenes/${orden.id}/estado`, { token: A, cuerpo: { estado: 'en_proceso' }, esperado: 422 })
ok(sinAnt.datos.codigo === 'SIN_ANTICIPO', 'CA_48_03 sin anticipo no pasa a en proceso')
const venta = (await pedir('POST', '/ventas', { token: A, cuerpo: { ordenId: orden.id }, esperado: 201 })).datos
ok(venta.montoAnticipo === Math.round(valorada.montoTotal / 2) && venta.estadoPago === 'pendiente_anticipo', 'HU_55 venta con anticipo del 50 %')
await pedir('POST', '/ventas', { token: A, cuerpo: { ordenId: orden.id }, esperado: 422 })
const exceso = await pedir('POST', '/abonos', { token: A, cuerpo: { ventaId: venta.id, monto: venta.montoTotal + 1, tipoAbono: 'anticipo', metodoPago: 'Nequi' }, esperado: 422 })
ok(exceso.datos.codigo === 'ABONO_SUPERA_SALDO', 'CA_58_02 abono mayor al saldo rechazado')
const ab1 = (await pedir('POST', '/abonos', { token: A, cuerpo: { ventaId: venta.id, monto: venta.montoAnticipo, tipoAbono: 'anticipo', metodoPago: 'Nequi', referencia: 'N-1' }, esperado: 201 })).datos
ok(ab1.venta.estadoPago === 'abonada' && ab1.ordenEnProceso, 'HU_58 anticipo → venta abonada y orden en proceso')

// ---------------------------------------------------------------- agenda
const libres = (await pedir('GET', `/disponibilidad/libres?fecha=${dia}&tecnico=${tec.tecnico.id}`, { token: A })).datos
ok(libres.length === 1, 'CA_51_02 franjas libres del técnico')
const visita = (await pedir('POST', '/agenda', { token: A, cuerpo: { ordenId: orden.id, disponibilidadId: libres[0].id }, esperado: 201 })).datos
const franjaOcupada = (await pedir('GET', `/disponibilidad?tecnico=${tec.tecnico.id}&desde=${dia}&hasta=${dia}`, { token: A })).datos
ok(franjaOcupada[0].estado === 'ocupada', 'CA_51_04 la franja pasa a ocupada')
await pedir('POST', '/agenda', { token: A, cuerpo: { ordenId: orden.id, disponibilidadId: libres[0].id }, esperado: 422 })

// --------------------------------------------------------- app móvil
const T = (await pedir('POST', '/auth/login', { cuerpo: { usuario: tec.cuenta.correo, contrasena: tec.cuenta.contrasenaTemporal, canal: 'movil' } })).datos.token
const asignadas = (await pedir('GET', '/movil/ordenes', { token: T })).datos
ok(asignadas.some((o) => o.ordenId === orden.id), 'Móvil HU_03 órdenes asignadas')
await pedir('POST', `/movil/visitas/${visita.id}/fin`, { token: T, esperado: 422 })
await pedir('POST', `/movil/visitas/${visita.id}/inicio`, { token: T })
await pedir('PUT', `/movil/ordenes/${orden.id}/diagnostico`, { token: T, cuerpo: { hallazgos: 'Ventiladores sucios y batería de la UPS agotada.' } })
await pedir('POST', `/movil/ordenes/${orden.id}/materiales`, { token: T, cuerpo: { materiales: [{ descripcion: 'Pasta térmica', cantidad: 2 }] }, esperado: 201 })
const recot = (await pedir('POST', `/movil/ordenes/${orden.id}/recotizacion`, { token: T, cuerpo: { repuestos: [{ descripcion: 'Ventilador 92 mm', cantidad: 1 }] }, esperado: 201 })).datos
const enEspera = (await pedir('GET', `/ordenes/${orden.id}`, { token: A })).datos
ok(enEspera.estado === 'en_espera_repuesto', 'Móvil CA_11_03 orden en espera de repuesto')
await pedir('PUT', `/cotizaciones/${recot.cotizacion.id}`, { token: A, cuerpo: { descripcion: 'Repuesto', items: [{ tipo: 'repuesto', descripcion: 'Ventilador 92 mm', cantidad: 1, precioUnitario: 45000 }] } })
await pedir('POST', `/cotizaciones/${recot.cotizacion.id}/enviar`, { token: A })
await pedir('POST', `/portal/cotizaciones/${recot.cotizacion.id}/decision`, { token: C, cuerpo: { decision: 'aprobada' } })
const conRepuesto = (await pedir('GET', `/ordenes/${orden.id}`, { token: A })).datos
ok(conRepuesto.estado === 'en_proceso' && conRepuesto.items.length === 4 && conRepuesto.venta.montoTotal === valorada.montoTotal + 45000,
  'Recotización aprobada: ítem agregado, venta actualizada y orden en proceso')
await pedir('PUT', `/movil/ordenes/${orden.id}/solucion`, { token: T, cuerpo: { solucion: 'Limpieza, cambio de ventilador y batería de la UPS.' } })
await pedir('POST', `/movil/visitas/${visita.id}/fin`, { token: T })
const final = (await pedir('GET', `/ordenes/${orden.id}`, { token: A })).datos
ok(final.estado === 'finalizada' && final.reporteTecnico.solucion && final.reporteTecnico.materiales.length === 1, 'Móvil HU_05 orden finalizada con reporte técnico')
const hist = (await pedir('GET', `/movil/ordenes/${orden.id}/historial`, { token: T })).datos
ok(hist.length >= 6, `Móvil HU_10 historial (${hist.length} eventos)`)
await pedir('POST', '/auth/logout', { token: T, esperado: 204 })
await pedir('GET', '/movil/ordenes', { token: T, esperado: 401 })
ok(true, 'Móvil CA_02_02 el token queda invalidado al cerrar sesión')

// ---------------------------------------------------------- saldo y cliente
const v2 = (await pedir('GET', `/ventas/orden/${orden.id}`, { token: A })).datos
await pedir('POST', '/abonos', { token: A, cuerpo: { ventaId: v2.id, monto: v2.saldo, tipoAbono: 'saldo', metodoPago: 'Transferencia', referencia: 'T-99' }, esperado: 201 })
const pagada = (await pedir('GET', `/ventas/${v2.id}`, { token: A })).datos
ok(pagada.estadoPago === 'pagada' && pagada.saldo === 0, 'CA_57_02 saldo cero → pagada')
const miOrden = (await pedir('GET', `/portal/ordenes/${orden.id}`, { token: C })).datos
ok(miOrden.solucion && miOrden.venta.estadoPago === 'pagada', 'HU_82 el cliente ve su orden, pago y solución')

// ---------------------------------------------------------- dashboard
const rep = (await pedir('GET', `/reportes/ordenes?desde=${f(new Date(hoy.getTime() - 200 * 86400000))}&hasta=${f(hoy)}`, { token: A })).datos
ok(rep.items.length > 10 && rep.totales.ordenes === rep.items.length, `HU_60 reporte de órdenes (${rep.items.length})`)
const repT = (await pedir('GET', '/reportes/tecnicos', { token: A })).datos
ok(repT.items.length >= 4, 'HU_61 reporte por técnico')
const ind = (await pedir('GET', '/indicadores/servicios-ordenes', { token: A })).datos
ok(ind.ordenesPorEstado.length === 5, `HU_63 indicadores (${ind.serviciosRealizados} servicios realizados)`)
const mas = (await pedir('GET', '/indicadores/mas-solicitados', { token: A })).datos
ok(mas.servicios.length > 0, 'HU_64 servicios más solicitados')
const est = (await pedir('GET', '/estadisticas', { token: A })).datos
ok(typeof est.ingresos === 'number' && est.serie.length > 0, `HU_65 estadísticas (ingresos ${est.ingresos}, aprobación ${est.tasaAprobacion} %)`)
const acc = (await pedir('GET', '/accesos?resultado=bloqueado', { token: A })).datos
ok(acc.items.length >= 1, 'HU_74 registro de accesos con bloqueos')
const busq = (await pedir('GET', `/busqueda?q=${encodeURIComponent('lucia')}`, { token: A })).datos
ok(busq.some((r) => r.tipo === 'Cliente'), 'Buscador global')

// ---------------------------------------------------------- recuperación
const rec = (await pedir('POST', '/auth/recuperar', { cuerpo: { correo: `lucia${unico}@gmail.com` } })).datos
const inex = (await pedir('POST', '/auth/recuperar', { cuerpo: { correo: `noexiste${unico}@gmail.com` } })).datos
ok(rec.mensaje === inex.mensaje, 'CA_72_04 mismo mensaje exista o no el correo')
const token = new URL(rec.enlaceDesarrollo).searchParams.get('token')
await pedir('GET', `/auth/restablecer/${token}`)
await pedir('POST', '/auth/restablecer', { cuerpo: { token, nueva: 'NuevaClave9', confirmacion: 'OtraClave9' }, esperado: 422 })
await pedir('POST', '/auth/restablecer', { cuerpo: { token, nueva: 'NuevaClave9', confirmacion: 'NuevaClave9' } })
await pedir('POST', '/auth/restablecer', { cuerpo: { token, nueva: 'NuevaClave9', confirmacion: 'NuevaClave9' }, esperado: 422 })
await pedir('GET', '/portal/perfil', { token: C, esperado: 401 })
ok(true, 'CA_73_05 restablecer cierra las sesiones abiertas')
await pedir('POST', '/auth/login', { cuerpo: { usuario: `lucia${unico}@gmail.com`, contrasena: 'NuevaClave9' } })

// ---------------------------------------------------------- estado cliente
const cid = perfil.id
const conf = await pedir('PATCH', `/clientes/${cid}/estado`, { token: A, cuerpo: { estado: 'inactivo' } })
ok(conf.datos.estado === 'inactivo', 'HU_83 cliente inactivado')
const loginInactivo = await pedir('POST', '/auth/login', { cuerpo: { usuario: `lucia${unico}@gmail.com`, contrasena: 'NuevaClave9' }, esperado: 403 })
ok(loginInactivo.datos.codigo === 'USUARIO_INACTIVO', 'CA_83_04 cliente inactivo no inicia sesión')

console.log(`\n${pasos - fallos}/${pasos} comprobaciones correctas${fallos ? ` · ${fallos} fallos` : ''}`)
process.exit(fallos ? 1 : 0)
