import { Router, type Request } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { cuentaPorId } from '../auth/rutas.js'
import { notificarConPermiso } from '../avisos.js'
import { correoRequerido, iso, numeroCotizacion, telefono, textoOpcional, textoRequerido } from '../comun.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, ErrorHttp, noEncontrado, regla } from '../errores.js'
import { detalleCotizacion, guardarDetalle, registrarDecision } from './cotizaciones.js'
import { detalleOrden } from './ordenes.js'

/**
 * Portal del cliente: Autogestión de la cuenta (HU_76, HU_77), Portal de
 * Cotizaciones (HU_78 – HU_80) y Consultar mis órdenes (HU_82).
 * Todo va filtrado por el cliente de la sesión: nadie ve lo de otro
 * (CA_76_03, CA_79_04, CA_82_01).
 */
export const rutasPortal = Router()
rutasPortal.use(sesion)

function clienteDe(req: Request): number {
  const id = req.sesion?.clienteId
  if (!id) throw new ErrorHttp(403, 'SIN_CLIENTE', 'Tu cuenta no está vinculada a un cliente.')
  return id
}

// ----------------------------------------------------------------- perfil

async function perfil(clienteId: number) {
  const c = await unaFila<{
    id: number; documento_identidad: string; nombres: string; apellidos: string; telefono: string | null
    direccion: string | null; correo: string | null; fecha_registro: Date; estado: string
  }>(`SELECT * FROM cliente WHERE id = $1`, [clienteId])
  if (!c) throw noEncontrado('tu registro de cliente')
  // CA_76_02 · la contraseña nunca se muestra
  return {
    id: c.id,
    documento: c.documento_identidad,
    nombres: c.nombres,
    apellidos: c.apellidos,
    telefono: c.telefono ?? '',
    direccion: c.direccion ?? '',
    correo: c.correo ?? '',
    fechaRegistro: iso(c.fecha_registro),
    estado: c.estado,
  }
}

/** HU_76 · Consultar mis datos de perfil */
rutasPortal.get(
  '/perfil',
  permiso('portal.consultar_perfil'),
  asincrono(async (req, res) => {
    res.json(await perfil(clienteDe(req)))
  }),
)

/**
 * HU_77 · Actualizar mis datos. CA_77_02: el documento no se edita.
 * CA_77_03: el correo no puede estar en uso por otra cuenta. La contraseña se
 * cambia en POST /auth/contrasena, que exige la actual (CA_77_04).
 */
rutasPortal.put(
  '/perfil',
  permiso('portal.actualizar_perfil'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const d = z
      .object({
        nombres: textoRequerido(100, 'Los nombres'),
        apellidos: textoRequerido(100, 'Los apellidos'),
        telefono: telefono.refine((v) => v !== null, 'El teléfono es obligatorio'),
        direccion: textoRequerido(150, 'La dirección'),
        correo: correoRequerido,
      })
      .parse(req.body)
    if (await unaFila(`SELECT 1 FROM usuario WHERE correo = $1 AND id <> $2`, [d.correo, req.sesion!.usuarioId])) {
      throw new ErrorHttp(409, 'CORREO_EN_USO', 'Ese correo ya está en uso por otra cuenta.')
    }
    await enTransaccion(async (tx) => {
      // CA_77_05 · se actualiza el registro del cliente (y su cuenta de acceso)
      await consultar(
        `UPDATE cliente SET nombres = $2, apellidos = $3, telefono = $4, direccion = $5, correo = $6 WHERE id = $1`,
        [clienteId, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo], tx)
      await consultar(
        `UPDATE usuario SET nombres = $2, apellidos = $3, telefono = $4, correo = $5 WHERE id = $1`,
        [req.sesion!.usuarioId, d.nombres, d.apellidos, d.telefono, d.correo], tx)
    })
    res.json({ perfil: await perfil(clienteId), cuenta: await cuentaPorId(req.sesion!.usuarioId) })
  }),
)

/** Inicio del portal: lo que el cliente tiene pendiente. */
rutasPortal.get(
  '/resumen',
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const r = await unaFila<Record<string, number>>(
      `SELECT
         (SELECT count(*) FROM cotizacion WHERE cliente_id = $1 AND estado = 'pendiente')::int  AS por_decidir,
         (SELECT count(*) FROM cotizacion WHERE cliente_id = $1 AND estado = 'solicitada')::int AS en_valoracion,
         (SELECT count(*) FROM v_orden_cliente oc JOIN orden o ON o.id = oc.orden_id
           WHERE oc.cliente_id = $1 AND o.estado NOT IN ('finalizada', 'cancelada'))::int      AS ordenes_activas,
         (SELECT count(*) FROM v_orden_cliente oc JOIN orden o ON o.id = oc.orden_id
           WHERE oc.cliente_id = $1 AND o.estado = 'finalizada')::int                          AS ordenes_finalizadas,
         (SELECT coalesce(sum(saldo), 0) FROM v_ventas WHERE cliente_id = $1 AND estado_pago <> 'anulada') AS saldo`,
      [clienteId],
    )
    const proxima = await unaFila<{ fecha_programada: Date; tecnico: string; codigo_orden: string; orden_id: number }>(
      `SELECT a.fecha_programada, trim(t.nombres || ' ' || t.apellidos) AS tecnico, o.codigo_orden, o.id AS orden_id
         FROM agendamiento a JOIN tecnico t ON t.id = a.tecnico_id JOIN orden o ON o.id = a.orden_id
         JOIN v_orden_cliente oc ON oc.orden_id = o.id
        WHERE oc.cliente_id = $1 AND a.estado = 'pendiente' AND a.fecha_programada >= now() - interval '3 hours'
        ORDER BY a.fecha_programada LIMIT 1`,
      [clienteId],
    )
    res.json({
      ...r,
      proximaVisita: proxima ? { fecha: iso(proxima.fecha_programada), tecnico: proxima.tecnico, codigo: proxima.codigo_orden, ordenId: proxima.orden_id } : null,
    })
  }),
)

// ----------------------------------------------------------- cotizaciones

/** HU_79 · Consultar mis cotizaciones (CA_79_01: solo las del cliente autenticado). */
rutasPortal.get(
  '/cotizaciones',
  permiso('portal.consultar_cotizaciones'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const filas = await consultar<{ id: number; fecha_cotizacion: Date; estado: string; monto_total: number; origen: string; items: number; resumen: string | null; orden_id: number | null }>(
      `SELECT q.id, q.fecha_cotizacion, q.estado, q.monto_total, q.origen, q.orden_id,
              (SELECT count(*) FROM detalle_cotizacion dc WHERE dc.cotizacion_id = q.id)::int AS items,
              (SELECT string_agg(coalesce(s.nombre, dc.descripcion), ', ' ORDER BY dc.id) FROM detalle_cotizacion dc
                 LEFT JOIN servicio s ON s.id = dc.servicio_id WHERE dc.cotizacion_id = q.id) AS resumen
         FROM cotizacion q WHERE q.cliente_id = $1 ORDER BY q.fecha_cotizacion DESC`,
      [clienteId],
    )
    // CA_79_02 · el monto se muestra cuando ya está valorada
    res.json(filas.map((f) => ({
      id: f.id,
      numero: numeroCotizacion(f.id),
      fecha: iso(f.fecha_cotizacion),
      estado: f.estado,
      montoTotal: f.estado === 'solicitada' ? null : f.monto_total,
      items: f.items,
      resumen: f.resumen ?? '',
      recotizacion: f.orden_id !== null,
    })))
  }),
)

rutasPortal.get(
  '/cotizaciones/:id',
  permiso('portal.consultar_cotizaciones'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const cot = await detalleCotizacion(id)
    // CA_79_04 · nunca la de otro cliente
    if (cot.cliente.id !== clienteId) throw noEncontrado('esa cotización')
    const valorada = cot.estado !== 'solicitada'
    res.json({
      ...cot,
      montoTotal: valorada ? cot.montoTotal : null,
      detalle: cot.detalle.map((i) => ({ ...i, precioUnitario: valorada ? i.precioUnitario : null, subtotal: valorada ? i.subtotal : null, precioActual: undefined })),
      respondidaPor: undefined,
    })
  }),
)

/**
 * HU_78 · Solicitar los servicios que necesito.
 * CA_78_01 servicios activos con cantidad · CA_78_02 problema y dirección ·
 * CA_78_03 crea una cotización «solicitada», sin valores · CA_78_04 avisa al
 * administrador · CA_78_05 queda en «mis cotizaciones».
 */
rutasPortal.post(
  '/solicitudes',
  permiso('portal.solicitar_servicios'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const d = z
      .object({
        items: z
          .array(z.object({
            servicioId: z.coerce.number().int().positive(),
            cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').max(50, 'Máximo 50 unidades por servicio'),
          }))
          .min(1, 'Selecciona al menos un servicio')
          .max(20),
        descripcion: textoRequerido(2000, 'La descripción del problema'),
        direccion: textoRequerido(150, 'La dirección'),
      })
      .parse(req.body)

    const cliente = await unaFila<{ estado: string; nombre: string }>(
      `SELECT estado, trim(nombres || ' ' || apellidos) AS nombre FROM cliente WHERE id = $1`, [clienteId])
    // CA_83_02 · un cliente inactivo no puede solicitar servicios
    if (cliente?.estado !== 'activo') throw regla('CLIENTE_INACTIVO', 'Tu cuenta de cliente está inactiva.')

    const unicos = new Map<number, number>()
    for (const i of d.items) unicos.set(i.servicioId, (unicos.get(i.servicioId) ?? 0) + i.cantidad)
    const activos = await consultar<{ id: number }>(`SELECT id FROM servicio WHERE id = ANY($1::int[]) AND estado = 'activo'`, [[...unicos.keys()]])
    if (activos.length !== unicos.size) throw regla('SERVICIO_INACTIVO', 'Uno de los servicios ya no está disponible. Actualiza el catálogo.')

    const id = await enTransaccion(async (tx) => {
      const fila = await unaFila<{ id: number }>(
        `INSERT INTO cotizacion (cliente_id, estado, origen, descripcion, direccion)
         VALUES ($1, 'solicitada', 'cliente', $2, $3) RETURNING id`,
        [clienteId, d.descripcion, d.direccion], tx)
      await guardarDetalle(tx, fila!.id, [...unicos].map(([servicioId, cantidad]) => ({ tipo: 'servicio' as const, servicioId, cantidad })), false)
      await notificarConPermiso('cotizaciones.editar', {
        titulo: 'Nueva solicitud de cotización',
        mensaje: `${cliente.nombre} solicitó ${unicos.size} servicio(s) desde el portal.`,
        enlace: `/cotizaciones/${fila!.id}`,
      }, tx)
      return fila!.id
    })
    res.status(201).json({ id, numero: numeroCotizacion(id), mensaje: 'Recibimos tu solicitud. Te avisaremos cuando la cotización esté lista.' })
  }),
)

/** HU_80 · Aprobar o rechazar mi cotización (CA_80_05: la decisión no se cambia). */
rutasPortal.post(
  '/cotizaciones/:id/decision',
  permiso('portal.decidir_cotizacion'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const d = z
      .object({ decision: z.enum(['aprobada', 'rechazada']), motivo: textoOpcional(255) })
      .parse(req.body)
    const cot = await detalleCotizacion(id)
    if (cot.cliente.id !== clienteId) throw noEncontrado('esa cotización')
    await registrarDecision(id, d.decision, d.motivo, req.sesion!.usuarioId, 'cliente')
    res.json({
      mensaje: d.decision === 'aprobada'
        ? 'Aprobaste la cotización. RvR Tecnologías generará tu orden de servicio y te contactará para agendar la visita.'
        : 'Registramos que rechazaste la cotización. Gracias por contarnos el motivo.',
    })
  }),
)

// ---------------------------------------------------------------- órdenes

/** HU_82 · Consultar mis órdenes (código, servicios, estado y fecha de visita). */
rutasPortal.get(
  '/ordenes',
  permiso('portal.consultar_ordenes'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const filas = await consultar<{ id: number; codigo_orden: string; estado: string; fecha_creacion: Date; servicios: string | null; visita: Date | null; saldo: number | null }>(
      `SELECT o.id, o.codigo_orden, o.estado, o.fecha_creacion,
              (SELECT string_agg(coalesce(s.nombre, dc.descripcion), ', ' ORDER BY dc.id)
                 FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
                 LEFT JOIN servicio s ON s.id = dc.servicio_id WHERE d.orden_id = o.id) AS servicios,
              (SELECT a.fecha_programada FROM agendamiento a WHERE a.orden_id = o.id AND a.estado IN ('pendiente', 'cumplida')
                ORDER BY (a.estado = 'pendiente') DESC, a.fecha_programada DESC LIMIT 1) AS visita,
              v.saldo
         FROM v_orden_cliente oc JOIN orden o ON o.id = oc.orden_id
         LEFT JOIN v_ventas v ON v.orden_id = o.id AND v.estado_pago <> 'anulada'
        WHERE oc.cliente_id = $1 ORDER BY o.fecha_creacion DESC`,
      [clienteId],
    )
    res.json(filas.map((f) => ({
      id: f.id, codigo: f.codigo_orden, estado: f.estado, fecha: iso(f.fecha_creacion),
      servicios: f.servicios ?? '', fechaVisita: iso(f.visita), saldo: f.saldo,
    })))
  }),
)

rutasPortal.get(
  '/ordenes/:id',
  permiso('portal.consultar_ordenes'),
  asincrono(async (req, res) => {
    const clienteId = clienteDe(req)
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const o = await detalleOrden(id)
    if (o.cliente?.id !== clienteId) throw noEncontrado('esa orden')
    // CA_82_03 técnico, estado de pago, anticipo y saldo · CA_82_04 solución al finalizar
    res.json({
      id: o.id,
      codigo: o.codigo,
      estado: o.estado,
      fechaCreacion: o.fechaCreacion,
      items: o.items.map((i) => ({ id: i.id, tipo: i.tipo, nombre: i.nombre, cantidad: i.cantidad, subtotal: i.subtotal, estado: i.estado })),
      visitas: o.visitas.filter((v) => v.estado !== 'reprogramada').map((v) => ({
        id: v.id, tecnico: v.tecnico.nombre, fechaProgramada: v.fechaProgramada, estado: v.estado, inicio: v.inicio, fin: v.fin,
      })),
      venta: o.venta,
      abonos: o.abonos,
      solucion: o.estado === 'finalizada' ? o.reporteTecnico.solucion : null,
      diagnostico: o.estado === 'finalizada' ? o.reporteTecnico.diagnostico : null,
      historial: o.historial.filter((h) => h.nuevo !== null).map((h) => ({ fecha: h.fecha, estado: h.nuevo, descripcion: h.descripcion })),
      cotizaciones: o.cotizaciones,
    })
  }),
)
