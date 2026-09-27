import { Router, type Request } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { notificarCliente, notificarConPermiso } from '../avisos.js'
import { idRuta, iso, numeroCotizacion, textoOpcional } from '../comun.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, ErrorHttp, noEncontrado, regla } from '../errores.js'
import { detalleOrden, cambiarEstadoOrden, ETIQUETA_ORDEN, type EstadoOrden } from './ordenes.js'

/**
 * API de la aplicación móvil del técnico (Proceso Móvil de la ficha).
 * La web no tiene pantallas de técnico: la app móvil consume estas rutas.
 *
 *   Acceso móvil          POST /api/auth/login {usuario, contrasena, canal:"movil"}
 *                         POST /api/auth/logout            (invalida el token)
 *   Seguimiento órdenes   GET  /api/movil/ordenes           HU_03
 *                         GET  /api/movil/ordenes/:id
 *                         POST /api/movil/visitas/:id/inicio HU_04
 *                         POST /api/movil/visitas/:id/fin    HU_05
 *                         PATCH /api/movil/ordenes/:id/estado HU_09
 *                         GET  /api/movil/ordenes/:id/historial HU_10
 *   Reporte técnico       PUT  /api/movil/ordenes/:id/diagnostico HU_06
 *                         POST /api/movil/ordenes/:id/materiales  HU_07
 *                         PUT  /api/movil/ordenes/:id/solucion    HU_08
 *                         POST /api/movil/ordenes/:id/recotizacion HU_11
 */
export const rutasMovil = Router()
rutasMovil.use(sesion)

function tecnicoDe(req: Request): number {
  const id = req.sesion?.tecnicoId
  if (!id) throw new ErrorHttp(403, 'SOLO_TECNICOS', 'Tu cuenta no está vinculada a un técnico activo.')
  return id
}

/** La orden debe estar asignada al técnico (tiene o tuvo una visita suya). */
async function exigirAsignada(ordenId: number, tecnicoId: number) {
  const fila = await unaFila(`SELECT 1 FROM agendamiento WHERE orden_id = $1 AND tecnico_id = $2 AND estado <> 'reprogramada' LIMIT 1`,
    [ordenId, tecnicoId])
  if (!fila) throw noEncontrado('esa orden entre tus asignaciones')
}

/** Móvil CA_09_02 · Transiciones que puede hacer el técnico. */
const TRANSICIONES_TECNICO: Record<EstadoOrden, EstadoOrden[]> = {
  esperando_anticipo: [],
  en_proceso: ['en_espera_repuesto', 'finalizada'],
  en_espera_repuesto: ['en_proceso'],
  finalizada: [],
  cancelada: [],
}

/** Móvil HU_03 · Órdenes asignadas activas, con filtro por fecha o estado (CA_03_03). */
rutasMovil.get(
  '/ordenes',
  permiso('movil.consultar_ordenes'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const p = z
      .object({
        fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
        estado: z.enum(['esperando_anticipo', 'en_proceso', 'en_espera_repuesto', 'finalizada', 'cancelada']).optional().catch(undefined),
        historial: z.coerce.boolean().default(false),
      })
      .parse(req.query)
    const filas = await consultar<{
      visita_id: number; orden_id: number; codigo_orden: string; estado: string; fecha_programada: Date; visita_estado: string
      fecha_inicio: Date | null; fecha_fin: Date | null; cliente: string | null; telefono: string | null; direccion: string | null; servicios: string | null
    }>(
      `SELECT a.id AS visita_id, o.id AS orden_id, o.codigo_orden, o.estado, a.fecha_programada, a.estado AS visita_estado,
              a.fecha_inicio, a.fecha_fin, trim(c.nombres || ' ' || c.apellidos) AS cliente, c.telefono,
              coalesce(q.direccion, c.direccion) AS direccion,
              (SELECT string_agg(coalesce(s.nombre, dc.descripcion), ', ' ORDER BY dc.id)
                 FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
                 LEFT JOIN servicio s ON s.id = dc.servicio_id WHERE d.orden_id = o.id) AS servicios
         FROM agendamiento a
         JOIN orden o ON o.id = a.orden_id
         LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
         LEFT JOIN cliente c ON c.id = oc.cliente_id
         LEFT JOIN cotizacion q ON q.id = oc.cotizacion_id
        WHERE a.tecnico_id = $1
          AND ($4 OR (a.estado = 'pendiente' AND o.estado NOT IN ('finalizada', 'cancelada')))
          AND ($2::date IS NULL OR a.fecha_programada::date = $2::date)
          AND ($3::text IS NULL OR o.estado = $3)
        ORDER BY a.fecha_programada`,
      [tecnicoId, p.fecha ?? null, p.estado ?? null, p.historial],
    )
    // CA_03_02 · número de orden, cliente, servicio, dirección y fecha de visita
    res.json(filas.map((f) => ({
      visitaId: f.visita_id,
      ordenId: f.orden_id,
      codigo: f.codigo_orden,
      estado: f.estado,
      etiquetaEstado: ETIQUETA_ORDEN[f.estado as EstadoOrden],
      fechaVisita: iso(f.fecha_programada),
      estadoVisita: f.visita_estado,
      iniciada: iso(f.fecha_inicio),
      finalizada: iso(f.fecha_fin),
      cliente: f.cliente ?? '',
      telefono: f.telefono ?? '',
      direccion: f.direccion ?? '',
      servicios: f.servicios ?? '',
    })))
  }),
)

/** Detalle de una orden asignada, con lo necesario para la visita. */
rutasMovil.get(
  '/ordenes/:id',
  permiso('movil.consultar_ordenes'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    await exigirAsignada(id, tecnicoId)
    const o = await detalleOrden(id)
    const recotizaciones = await consultar<{ id: number; estado: string; fecha_cotizacion: Date; fecha_respuesta: Date | null; monto_total: number }>(
      `SELECT id, estado, fecha_cotizacion, fecha_respuesta, monto_total FROM cotizacion WHERE orden_id = $1 ORDER BY fecha_cotizacion DESC`, [id])
    res.json({
      id: o.id,
      codigo: o.codigo,
      estado: o.estado,
      etiquetaEstado: ETIQUETA_ORDEN[o.estado],
      transiciones: TRANSICIONES_TECNICO[o.estado],
      observaciones: o.observaciones,
      cliente: o.cliente,
      items: o.items.map((i) => ({ id: i.id, tipo: i.tipo, nombre: i.nombre, cantidad: i.cantidad, estado: i.estado, notas: i.notas })),
      visitas: o.visitas.filter((v) => v.tecnico.id === tecnicoId),
      reporteTecnico: o.reporteTecnico,
      // Móvil CA_11_04 · el técnico consulta si la recotización fue aprobada o rechazada
      recotizaciones: recotizaciones.map((r) => ({
        id: r.id, numero: numeroCotizacion(r.id), estado: r.estado, fecha: iso(r.fecha_cotizacion), respuesta: iso(r.fecha_respuesta),
      })),
      anticipoRegistrado: o.venta ? o.venta.abonado >= o.venta.montoAnticipo && o.venta.abonado > 0 : false,
    })
  }),
)

/** Móvil HU_10 · Historial de cambios de estado y observaciones, cronológico (CA_10_03). */
rutasMovil.get(
  '/ordenes/:id/historial',
  permiso('movil.consultar_historial'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    await exigirAsignada(id, tecnicoId)
    const o = await detalleOrden(id)
    res.json(o.historial)
  }),
)

/** Visita del técnico (debe ser suya). */
async function visitaPropia(visitaId: number, tecnicoId: number) {
  const v = await unaFila<{ id: number; orden_id: number; estado: string; fecha_inicio: Date | null; fecha_fin: Date | null; codigo_orden: string }>(
    `SELECT a.id, a.orden_id, a.estado, a.fecha_inicio, a.fecha_fin, o.codigo_orden
       FROM agendamiento a JOIN orden o ON o.id = a.orden_id WHERE a.id = $1 AND a.tecnico_id = $2`,
    [visitaId, tecnicoId])
  if (!v) throw noEncontrado('esa visita entre tus asignaciones')
  return v
}

/**
 * Móvil HU_04 · Registrar inicio de visita. CA_04_02 hora automática y orden
 * «en proceso» (si tiene el anticipo, CA_48_03) · CA_04_03 avisa al administrador.
 */
rutasMovil.post(
  '/visitas/:id/inicio',
  permiso('movil.registrar_visita'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const v = await visitaPropia(idRuta.parse(req.params.id), tecnicoId)
    if (v.estado !== 'pendiente') throw regla('VISITA_CERRADA', `La visita está ${v.estado}.`)
    if (v.fecha_inicio) throw regla('VISITA_INICIADA', 'La visita ya estaba iniciada.')
    await enTransaccion(async (tx) => {
      await consultar(`UPDATE agendamiento SET fecha_inicio = now() WHERE id = $1`, [v.id], tx)
      const o = await unaFila<{ estado: string }>(`SELECT estado FROM orden WHERE id = $1`, [v.orden_id], tx)
      if (o?.estado === 'esperando_anticipo') {
        await cambiarEstadoOrden(tx, v.orden_id, 'en_proceso', 'El técnico inició la visita')
      } else {
        await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, 'El técnico inició la visita', $2)`,
          [v.orden_id, req.sesion!.usuarioId], tx)
      }
      await notificarConPermiso('agenda.consultar', {
        titulo: 'Visita iniciada',
        mensaje: `${req.sesion!.nombre} inició la visita de la orden ${v.codigo_orden} a las ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.`,
        enlace: `/ordenes/${v.orden_id}`,
      }, tx)
    }, { usuarioId: req.sesion!.usuarioId })
    res.json({ mensaje: 'Inicio de la visita registrado.', orden: await detalleOrden(v.orden_id).then((o) => ({ id: o.id, estado: o.estado })) })
  }),
)

/**
 * Móvil HU_05 · Registrar finalización. CA_05_02 exige diagnóstico y solución ·
 * CA_05_03 hora de cierre y orden «finalizada» · CA_05_04 avisa al
 * administrador y al cliente.
 */
rutasMovil.post(
  '/visitas/:id/fin',
  permiso('movil.registrar_visita'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const v = await visitaPropia(idRuta.parse(req.params.id), tecnicoId)
    const { notas } = z.object({ notas: textoOpcional(1000) }).parse(req.body ?? {})
    if (v.estado !== 'pendiente') throw regla('VISITA_CERRADA', `La visita está ${v.estado}.`)
    if (!v.fecha_inicio) throw regla('VISITA_SIN_INICIO', 'Registra primero el inicio de la visita.')
    const reporte = await unaFila<{ hallazgos: string; solucion_aplicada: string | null }>(
      `SELECT hallazgos, solucion_aplicada FROM diagnostico WHERE orden_id = $1`, [v.orden_id])
    if (!reporte?.hallazgos || !reporte.solucion_aplicada) {
      throw regla('REPORTE_INCOMPLETO', 'Registra el diagnóstico y la solución aplicada antes de finalizar la visita.')
    }
    await enTransaccion(async (tx) => {
      await consultar(`UPDATE agendamiento SET fecha_fin = now(), estado = 'cumplida', notas = coalesce($2, notas) WHERE id = $1`,
        [v.id, notas], tx)
      // Terminar el servicio completa sus ítems (CA_49_02 exige todos completos para finalizar).
      await consultar(`UPDATE detalle_orden SET estado_item = 'completado' WHERE orden_id = $1 AND estado_item <> 'completado'`, [v.orden_id], tx)
      const o = await unaFila<{ estado: EstadoOrden }>(`SELECT estado FROM orden WHERE id = $1`, [v.orden_id], tx)
      if (o?.estado === 'en_proceso') {
        await cambiarEstadoOrden(tx, v.orden_id, 'finalizada', 'Visita finalizada por el técnico')
      }
      await notificarConPermiso('ordenes.ver_detalle', {
        titulo: 'Servicio finalizado',
        mensaje: `${req.sesion!.nombre} finalizó la orden ${v.codigo_orden}.`,
        enlace: `/ordenes/${v.orden_id}`,
      }, tx)
      const cli = await unaFila<{ cliente_id: number | null }>(`SELECT cliente_id FROM v_orden_cliente WHERE orden_id = $1`, [v.orden_id], tx)
      if (cli?.cliente_id && o?.estado !== 'en_proceso') {
        await notificarCliente(cli.cliente_id, { titulo: 'Visita finalizada', mensaje: `El técnico terminó la visita de tu orden ${v.codigo_orden}.`, enlace: `/portal/ordenes/${v.orden_id}` }, tx)
      }
    }, { usuarioId: req.sesion!.usuarioId })
    res.json({ mensaje: 'Visita finalizada.', orden: await detalleOrden(v.orden_id).then((o) => ({ id: o.id, estado: o.estado })) })
  }),
)

/** Móvil HU_09 · Actualizar estado de la orden (solo transiciones del técnico). */
rutasMovil.patch(
  '/ordenes/:id/estado',
  permiso('movil.actualizar_estado'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    const d = z.object({ estado: z.enum(['en_proceso', 'en_espera_repuesto', 'finalizada']), motivo: textoOpcional(200) }).parse(req.body)
    await exigirAsignada(id, tecnicoId)
    if (d.estado === 'finalizada') {
      const reporte = await unaFila<{ solucion_aplicada: string | null }>(`SELECT solucion_aplicada FROM diagnostico WHERE orden_id = $1`, [id])
      if (!reporte?.solucion_aplicada) throw regla('REPORTE_INCOMPLETO', 'Registra el diagnóstico y la solución antes de finalizar.')
    }
    await enTransaccion(async (tx) => {
      await cambiarEstadoOrden(tx, id, d.estado, d.motivo ?? `El técnico cambió el estado a «${ETIQUETA_ORDEN[d.estado]}»`, TRANSICIONES_TECNICO)
    }, { usuarioId: req.sesion!.usuarioId })
    // CA_09_04 · el panel web lo ve en su siguiente consulta
    const o = await detalleOrden(id)
    res.json({ id: o.id, estado: o.estado, transiciones: TRANSICIONES_TECNICO[o.estado] })
  }),
)

/** Móvil HU_06 · Registrar diagnóstico del equipo (vinculado a la orden). */
rutasMovil.put(
  '/ordenes/:id/diagnostico',
  permiso('movil.reporte_tecnico'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    const { hallazgos } = z.object({ hallazgos: z.string().trim().min(10, 'Describe las fallas con al menos 10 caracteres').max(4000) }).parse(req.body)
    await exigirAsignada(id, tecnicoId)
    await consultar(
      `INSERT INTO diagnostico (orden_id, tecnico_id, hallazgos) VALUES ($1, $2, $3)
       ON CONFLICT (orden_id) DO UPDATE SET hallazgos = EXCLUDED.hallazgos, tecnico_id = EXCLUDED.tecnico_id, fecha_diagnostico = now()`,
      [id, tecnicoId, hallazgos])
    await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, 'Diagnóstico registrado desde el móvil', $2)`,
      [id, req.sesion!.usuarioId])
    res.json({ mensaje: 'Diagnóstico guardado.' })
  }),
)

/** Móvil HU_08 · Registrar solución aplicada. */
rutasMovil.put(
  '/ordenes/:id/solucion',
  permiso('movil.reporte_tecnico'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    const { solucion } = z.object({ solucion: z.string().trim().min(10, 'Describe la solución con al menos 10 caracteres').max(4000) }).parse(req.body)
    await exigirAsignada(id, tecnicoId)
    const fila = await unaFila(`UPDATE diagnostico SET solucion_aplicada = $2, fecha_solucion = now() WHERE orden_id = $1 RETURNING id`, [id, solucion])
    if (!fila) throw regla('SIN_DIAGNOSTICO', 'Registra primero el diagnóstico del equipo.')
    await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, 'Solución aplicada registrada desde el móvil', $2)`,
      [id, req.sesion!.usuarioId])
    res.json({ mensaje: 'Solución guardada.' })
  }),
)

/** Móvil HU_07 · Registrar materiales utilizados (varios por orden, CA_07_02). */
rutasMovil.post(
  '/ordenes/:id/materiales',
  permiso('movil.reporte_tecnico'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    const { materiales } = z
      .object({
        materiales: z.array(z.object({
          descripcion: z.string().trim().min(2, 'Describe el material').max(150),
          cantidad: z.coerce.number().int().min(1).max(9999),
        })).min(1, 'Agrega al menos un material').max(50),
      })
      .parse(req.body)
    await exigirAsignada(id, tecnicoId)
    await enTransaccion(async (tx) => {
      for (const m of materiales) {
        await consultar(`INSERT INTO material_orden (orden_id, tecnico_id, descripcion, cantidad) VALUES ($1, $2, $3, $4)`,
          [id, tecnicoId, m.descripcion, m.cantidad], tx)
      }
      await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
        [id, `${materiales.length} material(es) registrado(s) desde el móvil`, req.sesion!.usuarioId], tx)
    })
    res.status(201).json({ mensaje: 'Materiales guardados.' })
  }),
)

rutasMovil.get(
  '/ordenes/:id/materiales',
  permiso('movil.reporte_tecnico', 'movil.consultar_ordenes'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    await exigirAsignada(id, tecnicoId)
    res.json(await consultar(`SELECT id, descripcion, cantidad, fecha_registro AS fecha FROM material_orden WHERE orden_id = $1 ORDER BY id`, [id]))
  }),
)

/**
 * Móvil HU_11 · Solicitar recotización por repuesto. CA_11_02 crea una
 * cotización «solicitada» del mismo cliente, ligada a la orden, y avisa al
 * administrador · CA_11_03 la orden queda «en espera de repuesto».
 */
rutasMovil.post(
  '/ordenes/:id/recotizacion',
  permiso('movil.solicitar_recotizacion'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    const d = z
      .object({
        repuestos: z.array(z.object({
          descripcion: z.string().trim().min(2, 'Describe el repuesto').max(255),
          cantidad: z.coerce.number().int().min(1).max(999),
        })).min(1, 'Agrega al menos un repuesto').max(20),
        nota: textoOpcional(1000),
      })
      .parse(req.body)
    await exigirAsignada(id, tecnicoId)
    const cotId = await enTransaccion(async (tx) => {
      const o = await unaFila<{ estado: string; codigo_orden: string; cliente_id: number | null }>(
        `SELECT o.estado, o.codigo_orden, oc.cliente_id FROM orden o LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id WHERE o.id = $1`, [id], tx)
      if (!o?.cliente_id) throw noEncontrado('el cliente de esa orden')
      if (o.estado !== 'en_proceso') throw regla('ESTADO_INVALIDO', 'Solo se pide recotización con la orden en proceso.')
      const cot = await unaFila<{ id: number }>(
        `INSERT INTO cotizacion (cliente_id, estado, origen, descripcion, orden_id)
         VALUES ($1, 'solicitada', 'tecnico', $2, $3) RETURNING id`,
        [o.cliente_id, d.nota ?? `Recotización solicitada por el técnico para la orden ${o.codigo_orden}.`, id], tx)
      for (const r of d.repuestos) {
        await consultar(
          `INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, precio_unitario, tipo_item, descripcion) VALUES ($1, $2, 0, 'repuesto', $3)`,
          [cot!.id, r.cantidad, r.descripcion], tx)
      }
      await cambiarEstadoOrden(tx, id, 'en_espera_repuesto',
        `El técnico solicitó recotización por repuesto (${numeroCotizacion(cot!.id)})`, TRANSICIONES_TECNICO)
      await notificarConPermiso('cotizaciones.editar', {
        titulo: 'Recotización por repuesto',
        mensaje: `${req.sesion!.nombre} necesita cotizar un repuesto para la orden ${o.codigo_orden}.`,
        enlace: `/cotizaciones/${cot!.id}`,
      }, tx)
      return cot!.id
    }, { usuarioId: req.sesion!.usuarioId })
    res.status(201).json({ mensaje: 'Solicitud enviada al administrador.', cotizacion: { id: cotId, numero: numeroCotizacion(cotId) } })
  }),
)

/** Ítems: el técnico puede avanzar el estado y dejar notas por ítem. */
rutasMovil.patch(
  '/ordenes/:id/items/:itemId',
  permiso('movil.reporte_tecnico'),
  asincrono(async (req, res) => {
    const tecnicoId = tecnicoDe(req)
    const id = idRuta.parse(req.params.id)
    const itemId = idRuta.parse(req.params.itemId)
    const d = z.object({ estado: z.enum(['pendiente', 'en_proceso', 'completado']).optional(), notas: z.string().trim().max(2000).optional() }).parse(req.body)
    await exigirAsignada(id, tecnicoId)
    const fila = await unaFila(
      `UPDATE detalle_orden SET estado_item = coalesce($3, estado_item),
              notas_tecnico = CASE WHEN $5 THEN $4 ELSE notas_tecnico END
        WHERE id = $1 AND orden_id = $2 RETURNING id`,
      [itemId, id, d.estado ?? null, d.notas || null, d.notas !== undefined])
    if (!fila) throw noEncontrado('ese ítem de la orden')
    res.json({ mensaje: 'Ítem actualizado.' })
  }),
)
