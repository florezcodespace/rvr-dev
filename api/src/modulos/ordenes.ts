import { Router } from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { notificarCliente } from '../avisos.js'
import {
  filtroOpcional, idRuta, iso, listaBase, normalizar, numeroCotizacion, pagina, rangoFechas, sinTildes, textoOpcional,
} from '../comun.js'
import { consultar, enTransaccion, motivo, pool, unaFila, type Conexion } from '../db.js'
import { asincrono, noEncontrado, regla } from '../errores.js'

/**
 * Venta – Órdenes · Gestión de Órdenes de Servicio (HU_44 – HU_50).
 * Maestro-detalle: `orden` + `detalle_orden` (un ítem por ítem cotizado).
 */
export const rutasOrdenes = Router()
rutasOrdenes.use(sesion)

export const ESTADOS_ORDEN = ['esperando_anticipo', 'en_proceso', 'en_espera_repuesto', 'finalizada', 'cancelada'] as const
export type EstadoOrden = (typeof ESTADOS_ORDEN)[number]

/** CA_48_02 · Transiciones válidas; finalizada y cancelada son estados finales. */
export const TRANSICIONES: Record<EstadoOrden, EstadoOrden[]> = {
  esperando_anticipo: ['en_proceso', 'cancelada'],
  en_proceso: ['en_espera_repuesto', 'finalizada', 'cancelada'],
  en_espera_repuesto: ['en_proceso', 'cancelada'],
  finalizada: [],
  cancelada: [],
}

export const ETIQUETA_ORDEN: Record<EstadoOrden, string> = {
  esperando_anticipo: 'Esperando anticipo',
  en_proceso: 'En proceso',
  en_espera_repuesto: 'En espera de repuesto',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

// -------------------------------------------------------------- consultas

interface FilaOrden {
  id: number
  codigo_orden: string
  fecha_creacion: Date
  estado: EstadoOrden
  observaciones: string | null
  cliente_id: number | null
  cliente: string | null
  documento: string | null
  telefono: string | null
  direccion: string | null
  cotizacion_id: number | null
  monto_venta: number | null
  saldo: number | null
  estado_pago: string | null
  tecnico: string | null
  tecnico_id: number | null
  proxima_visita: Date | null
  servicios: string | null
}

const SELECT_ORDEN = `
  SELECT o.id, o.codigo_orden, o.fecha_creacion, o.estado, o.observaciones,
         oc.cliente_id, trim(c.nombres || ' ' || c.apellidos) AS cliente, c.documento_identidad AS documento,
         c.telefono, coalesce(q.direccion, c.direccion) AS direccion, oc.cotizacion_id,
         v.monto_total AS monto_venta, v.saldo, v.estado_pago,
         ag.tecnico, ag.tecnico_id, ag.proxima AS proxima_visita,
         (SELECT string_agg(coalesce(s.nombre, dc.descripcion), ', ' ORDER BY dc.id)
            FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
            LEFT JOIN servicio s ON s.id = dc.servicio_id
           WHERE d.orden_id = o.id) AS servicios
    FROM orden o
    LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
    LEFT JOIN cliente c    ON c.id = oc.cliente_id
    LEFT JOIN cotizacion q ON q.id = oc.cotizacion_id
    LEFT JOIN v_ventas v   ON v.orden_id = o.id
    LEFT JOIN LATERAL (
      SELECT trim(t.nombres || ' ' || t.apellidos) AS tecnico, t.id AS tecnico_id,
             CASE WHEN a.estado = 'pendiente' THEN a.fecha_programada END AS proxima
        FROM agendamiento a JOIN tecnico t ON t.id = a.tecnico_id
       WHERE a.orden_id = o.id AND a.estado IN ('pendiente', 'cumplida')
       ORDER BY (a.estado = 'pendiente') DESC, a.fecha_programada DESC LIMIT 1) ag ON true
`

const aResumen = (f: FilaOrden) => ({
  id: f.id,
  codigo: f.codigo_orden,
  fechaCreacion: iso(f.fecha_creacion),
  estado: f.estado,
  cliente: f.cliente_id ? { id: f.cliente_id, nombre: f.cliente, documento: f.documento } : null,
  servicios: f.servicios ?? '',
  montoVenta: f.monto_venta,
  saldo: f.saldo,
  estadoPago: f.estado_pago,
  tecnico: f.tecnico_id ? { id: f.tecnico_id, nombre: f.tecnico } : null,
  proximaVisita: iso(f.proxima_visita),
})

export async function detalleOrden(id: number, conexion: Conexion = pool) {
  const f = await unaFila<FilaOrden>(`${SELECT_ORDEN} WHERE o.id = $1`, [id], conexion)
  if (!f) throw noEncontrado('esa orden de servicio')

  const [items, visitas, diagnostico, materiales, venta, abonos, historial, cotizaciones] = await Promise.all([
    // CA_50_02 · ítems con servicio o repuesto, fecha de asignación, estado y notas
    consultar<{
      id: number; tipo_item: string; servicio: string | null; descripcion: string | null; cantidad: number
      precio_unitario: number; subtotal: number; fecha_asignacion: Date; estado_item: string; notas_tecnico: string | null
      cotizacion_id: number
    }>(
      `SELECT d.id, dc.tipo_item, s.nombre AS servicio, dc.descripcion, dc.cantidad, dc.precio_unitario, dc.subtotal,
              d.fecha_asignacion, d.estado_item, d.notas_tecnico, dc.cotizacion_id
         FROM detalle_orden d
         JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
         LEFT JOIN servicio s ON s.id = dc.servicio_id
        WHERE d.orden_id = $1 ORDER BY d.id`,
      [id], conexion,
    ),
    // CA_50_04 · agendamientos con técnico y fecha
    consultar<{
      id: number; tecnico_id: number; tecnico: string; telefono: string | null; fecha_programada: Date; estado: string
      notas: string | null; fecha_inicio: Date | null; fecha_fin: Date | null
    }>(
      `SELECT a.id, a.tecnico_id, trim(t.nombres || ' ' || t.apellidos) AS tecnico, t.telefono, a.fecha_programada,
              a.estado, a.notas, a.fecha_inicio, a.fecha_fin
         FROM agendamiento a JOIN tecnico t ON t.id = a.tecnico_id
        WHERE a.orden_id = $1 ORDER BY a.fecha_programada DESC`,
      [id], conexion,
    ),
    // CA_50_03 · diagnóstico y solución registrados desde el móvil
    unaFila<{ hallazgos: string; solucion_aplicada: string | null; fecha_diagnostico: Date; fecha_solucion: Date | null; tecnico: string | null }>(
      `SELECT g.hallazgos, g.solucion_aplicada, g.fecha_diagnostico, g.fecha_solucion,
              trim(t.nombres || ' ' || t.apellidos) AS tecnico
         FROM diagnostico g LEFT JOIN tecnico t ON t.id = g.tecnico_id WHERE g.orden_id = $1`,
      [id], conexion,
    ),
    consultar<{ id: number; descripcion: string; cantidad: number; fecha_registro: Date; tecnico: string | null }>(
      `SELECT m.id, m.descripcion, m.cantidad, m.fecha_registro, trim(t.nombres || ' ' || t.apellidos) AS tecnico
         FROM material_orden m LEFT JOIN tecnico t ON t.id = m.tecnico_id WHERE m.orden_id = $1 ORDER BY m.id`,
      [id], conexion,
    ),
    // CA_50_05 · monto, anticipo y saldo de la venta
    unaFila<{ id: number; monto_total: number; monto_anticipo: number; abonado: number; saldo: number; estado_pago: string; fecha_venta: Date }>(
      `SELECT id, monto_total, monto_anticipo, abonado, saldo, estado_pago, fecha_venta FROM v_ventas WHERE orden_id = $1`,
      [id], conexion,
    ),
    consultar<{ id: number; monto: number; tipo_abono: string; metodo_pago: string; referencia: string | null; fecha_abono: Date }>(
      `SELECT a.id, a.monto, a.tipo_abono, a.metodo_pago, a.referencia, a.fecha_abono
         FROM abonos a JOIN ventas v ON v.id = a.venta_id WHERE v.orden_id = $1 ORDER BY a.fecha_abono`,
      [id], conexion,
    ),
    consultar<{ id: number; estado_anterior: string | null; estado_nuevo: string | null; descripcion: string; fecha: Date; usuario: string | null }>(
      `SELECT h.id, h.estado_anterior, h.estado_nuevo, h.descripcion, h.fecha, trim(u.nombres || ' ' || u.apellidos) AS usuario
         FROM historial_orden h LEFT JOIN usuario u ON u.id = h.usuario_id
        WHERE h.orden_id = $1 ORDER BY h.fecha, h.id`,
      [id], conexion,
    ),
    // Cotizaciones de la orden: la de origen y las recotizaciones por repuesto
    consultar<{ id: number; estado: string; monto_total: number; origen: string; fecha_cotizacion: Date; recotizacion: boolean }>(
      `SELECT DISTINCT q.id, q.estado, q.monto_total, q.origen, q.fecha_cotizacion, (q.orden_id = $1) AS recotizacion
         FROM cotizacion q
        WHERE q.orden_id = $1
           OR q.id IN (SELECT dc.cotizacion_id FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id WHERE d.orden_id = $1)
        ORDER BY q.fecha_cotizacion`,
      [id], conexion,
    ),
  ])

  const totalItems = items.reduce((s, i) => s + i.subtotal, 0)
  return {
    ...aResumen(f),
    observaciones: f.observaciones ?? '',
    cliente: f.cliente_id
      ? { id: f.cliente_id, nombre: f.cliente, documento: f.documento, telefono: f.telefono ?? '', direccion: f.direccion ?? '' }
      : null,
    transiciones: TRANSICIONES[f.estado],
    items: items.map((i) => ({
      id: i.id,
      tipo: i.tipo_item,
      nombre: i.tipo_item === 'servicio' ? (i.servicio ?? 'Servicio') : (i.descripcion ?? 'Repuesto'),
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      subtotal: i.subtotal,
      fechaAsignacion: iso(i.fecha_asignacion),
      estado: i.estado_item,
      notas: i.notas_tecnico ?? '',
      cotizacionId: i.cotizacion_id,
    })),
    totalItems,
    visitas: visitas.map((v) => ({
      id: v.id,
      tecnico: { id: v.tecnico_id, nombre: v.tecnico, telefono: v.telefono ?? '' },
      fechaProgramada: iso(v.fecha_programada),
      estado: v.estado,
      notas: v.notas ?? '',
      inicio: iso(v.fecha_inicio),
      fin: iso(v.fecha_fin),
    })),
    reporteTecnico: {
      diagnostico: diagnostico?.hallazgos ?? null,
      fechaDiagnostico: iso(diagnostico?.fecha_diagnostico),
      solucion: diagnostico?.solucion_aplicada ?? null,
      fechaSolucion: iso(diagnostico?.fecha_solucion),
      tecnico: diagnostico?.tecnico ?? null,
      materiales: materiales.map((m) => ({ id: m.id, descripcion: m.descripcion, cantidad: m.cantidad, fecha: iso(m.fecha_registro), tecnico: m.tecnico })),
    },
    venta: venta
      ? {
          id: venta.id,
          montoTotal: venta.monto_total,
          montoAnticipo: venta.monto_anticipo,
          abonado: venta.abonado,
          saldo: venta.saldo,
          estadoPago: venta.estado_pago,
          fecha: iso(venta.fecha_venta),
        }
      : null,
    abonos: abonos.map((a) => ({
      id: a.id, monto: a.monto, tipo: a.tipo_abono, metodo: a.metodo_pago, referencia: a.referencia ?? '', fecha: iso(a.fecha_abono),
    })),
    historial: historial.map((h) => ({
      id: h.id, anterior: h.estado_anterior, nuevo: h.estado_nuevo, descripcion: h.descripcion, fecha: iso(h.fecha), usuario: h.usuario,
    })),
    cotizaciones: cotizaciones.map((q) => ({
      id: q.id, numero: numeroCotizacion(q.id), estado: q.estado, montoTotal: q.monto_total, origen: q.origen,
      fecha: iso(q.fecha_cotizacion), recotizacion: q.recotizacion,
    })),
  }
}

/**
 * Cambia el estado de una orden aplicando las reglas del negocio. Lo usan el
 * administrador (HU_48) y el técnico desde el móvil (Móvil HU_09).
 */
export async function cambiarEstadoOrden(
  tx: pg.PoolClient,
  id: number,
  destino: EstadoOrden,
  texto: string,
  validas: Record<EstadoOrden, EstadoOrden[]> = TRANSICIONES,
) {
  const o = await unaFila<{ estado: EstadoOrden; codigo_orden: string }>(
    `SELECT estado, codigo_orden FROM orden WHERE id = $1 FOR UPDATE`, [id], tx)
  if (!o) throw noEncontrado('esa orden de servicio')
  if (o.estado === destino) return o
  if (!validas[o.estado].includes(destino)) {
    throw regla('TRANSICION_INVALIDA', `Una orden «${ETIQUETA_ORDEN[o.estado]}» no puede pasar a «${ETIQUETA_ORDEN[destino]}».`)
  }
  // CA_48_03 · no pasa a «en proceso» sin el anticipo registrado
  if (destino === 'en_proceso' && o.estado === 'esperando_anticipo') {
    const venta = await unaFila<{ abonado: number; monto_anticipo: number; estado_pago: string }>(
      `SELECT abonado, monto_anticipo, estado_pago FROM v_ventas WHERE orden_id = $1`, [id], tx)
    if (!venta || venta.estado_pago === 'anulada' || venta.abonado < venta.monto_anticipo || venta.abonado === 0) {
      throw regla('SIN_ANTICIPO', 'La orden no puede pasar a «En proceso»: su venta no tiene registrado el anticipo.')
    }
  }
  // CA_49_02 · solo se finaliza con todos los ítems completados
  if (destino === 'finalizada') {
    const pendientes = await unaFila<{ n: number }>(
      `SELECT count(*)::int AS n FROM detalle_orden WHERE orden_id = $1 AND estado_item <> 'completado'`, [id], tx)
    if ((pendientes?.n ?? 0) > 0) {
      throw regla('ITEMS_PENDIENTES', `La orden tiene ${pendientes!.n} ítem(s) sin completar: complétalos antes de finalizarla.`)
    }
  }
  await motivo(tx, texto)
  await consultar(`UPDATE orden SET estado = $2 WHERE id = $1`, [id, destino], tx)

  // Al cancelar, las visitas pendientes se cancelan y sus franjas se liberan.
  if (destino === 'cancelada') {
    await consultar(
      `UPDATE disponibilidad SET estado = 'disponible'
        WHERE id IN (SELECT disponibilidad_id FROM agendamiento WHERE orden_id = $1 AND estado = 'pendiente' AND disponibilidad_id IS NOT NULL)`,
      [id], tx)
    await consultar(
      `UPDATE agendamiento SET estado = 'cancelada', notas = coalesce(notas || ' · ', '') || 'Cancelada con la orden'
        WHERE orden_id = $1 AND estado = 'pendiente'`, [id], tx)
  }

  const cliente = await unaFila<{ cliente_id: number | null }>(`SELECT cliente_id FROM v_orden_cliente WHERE orden_id = $1`, [id], tx)
  if (cliente?.cliente_id) {
    await notificarCliente(cliente.cliente_id, {
      titulo: `Tu orden ${o.codigo_orden}: ${ETIQUETA_ORDEN[destino].toLowerCase()}`,
      mensaje: texto,
      enlace: `/portal/ordenes/${id}`,
    }, tx)
  }
  return o
}

// ------------------------------------------------------------------ rutas

/** HU_46 listar · HU_45 buscar por código, cliente, técnico, fecha o estado */
rutasOrdenes.get(
  '/',
  permiso('ordenes.listar', 'ordenes.buscar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .merge(rangoFechas)
      .extend({
        estado: filtroOpcional(ESTADOS_ORDEN),
        cliente: z.coerce.number().int().positive().optional().catch(undefined),
        tecnico: z.coerce.number().int().positive().optional().catch(undefined),
        // CA_46_03 · ordenar por fecha o por estado
        orden: z.enum(['fecha', 'estado']).catch('fecha'),
      })
      .parse(req.query)
    const filas = await consultar<FilaOrden & { total: number }>(
      `WITH base AS (${SELECT_ORDEN})
       SELECT *, count(*) OVER ()::int AS total FROM base b
        WHERE ($1 = '' OR ${sinTildes(`codigo_orden || ' ' || coalesce(cliente, '') || ' ' || coalesce(documento, '') || ' ' || coalesce(tecnico, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR estado = $2)
          AND ($3::int IS NULL OR cliente_id = $3)
          AND ($4::int IS NULL OR EXISTS (SELECT 1 FROM agendamiento a WHERE a.orden_id = b.id AND a.tecnico_id = $4))
          AND ($5::date IS NULL OR fecha_creacion >= $5::date)
          AND ($6::date IS NULL OR fecha_creacion < $6::date + 1)
        ORDER BY ${p.orden === 'estado'
          ? `array_position(ARRAY['esperando_anticipo','en_proceso','en_espera_repuesto','finalizada','cancelada']::varchar[], estado), fecha_creacion DESC`
          : 'fecha_creacion DESC'}
        LIMIT $7 OFFSET $8`,
      [normalizar(p.q), p.estado ?? null, p.cliente ?? null, p.tecnico ?? null, p.desde ?? null, p.hasta ?? null,
        p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'esperando_anticipo')::int AS esperando_anticipo,
              count(*) FILTER (WHERE estado = 'en_proceso')::int         AS en_proceso,
              count(*) FILTER (WHERE estado = 'en_espera_repuesto')::int AS en_espera_repuesto,
              count(*) FILTER (WHERE estado = 'finalizada')::int         AS finalizada,
              count(*) FILTER (WHERE estado = 'cancelada')::int          AS cancelada
         FROM orden`,
    )
    res.json({ ...pagina(filas.map(aResumen), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos })
  }),
)

/** Cotizaciones aprobadas que aún no generan orden (CA_44_01 / CA_44_04). */
rutasOrdenes.get(
  '/cotizaciones-aprobadas',
  permiso('ordenes.registrar'),
  asincrono(async (_req, res) => {
    const filas = await consultar<{ id: number; cliente: string; monto_total: number; fecha_respuesta: Date | null; items: number }>(
      `SELECT q.id, trim(c.nombres || ' ' || c.apellidos) AS cliente, q.monto_total, q.fecha_respuesta,
              (SELECT count(*) FROM detalle_cotizacion dc WHERE dc.cotizacion_id = q.id)::int AS items
         FROM cotizacion q JOIN cliente c ON c.id = q.cliente_id
        WHERE q.estado = 'aprobada' AND q.orden_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM detalle_cotizacion dc JOIN detalle_orden d ON d.detalle_cotizacion_id = dc.id
                           WHERE dc.cotizacion_id = q.id)
        ORDER BY q.fecha_respuesta DESC NULLS LAST`,
    )
    res.json(filas.map((f) => ({
      id: f.id, numero: numeroCotizacion(f.id), cliente: f.cliente, montoTotal: f.monto_total,
      fechaAprobacion: iso(f.fecha_respuesta), items: f.items,
    })))
  }),
)

/** HU_50 · Ver detalle */
rutasOrdenes.get(
  '/:id',
  permiso('ordenes.ver_detalle'),
  asincrono(async (req, res) => {
    res.json(await detalleOrden(idRuta.parse(req.params.id)))
  }),
)

/**
 * HU_44 · Registrar la orden a partir de una cotización aprobada.
 * CA_44_02 código automático · CA_44_03 un ítem por ítem cotizado ·
 * CA_44_04 una sola orden por cotización · CA_44_05 ítems «pendiente» con
 * fecha de asignación · CA_44_06 orden «esperando anticipo».
 */
rutasOrdenes.post(
  '/',
  permiso('ordenes.registrar'),
  asincrono(async (req, res) => {
    const d = z
      .object({
        cotizacionId: z.coerce.number({ error: 'Selecciona la cotización aprobada' }).int().positive('Selecciona la cotización aprobada'),
        observaciones: textoOpcional(2000),
      })
      .parse(req.body)

    const id = await enTransaccion(async (tx) => {
      const cot = await unaFila<{ estado: string; orden_id: number | null; cliente_id: number }>(
        `SELECT estado, orden_id, cliente_id FROM cotizacion WHERE id = $1 FOR UPDATE`, [d.cotizacionId], tx)
      if (!cot) throw noEncontrado('esa cotización')
      // CA_40_03 / CA_40_04 · solo una aprobada da origen a una orden
      if (cot.estado !== 'aprobada') {
        throw regla('COTIZACION_NO_APROBADA', 'Solo una cotización aprobada puede dar origen a una orden de servicio.')
      }
      if (cot.orden_id) throw regla('ES_RECOTIZACION', 'Esa cotización es una recotización: sus ítems ya se agregaron a su orden.')
      const usada = await unaFila(
        `SELECT 1 FROM detalle_cotizacion dc JOIN detalle_orden d ON d.detalle_cotizacion_id = dc.id WHERE dc.cotizacion_id = $1`,
        [d.cotizacionId], tx)
      if (usada) throw regla('COTIZACION_CON_ORDEN', 'Esa cotización ya generó una orden de servicio.')

      await motivo(tx, `Orden creada desde la cotización ${numeroCotizacion(d.cotizacionId)}`)
      const orden = await unaFila<{ id: number; codigo_orden: string }>(
        `INSERT INTO orden (estado, observaciones) VALUES ('esperando_anticipo', $1) RETURNING id, codigo_orden`,
        [d.observaciones], tx)
      await consultar(
        `INSERT INTO detalle_orden (orden_id, detalle_cotizacion_id, estado_item)
         SELECT $1, id, 'pendiente' FROM detalle_cotizacion WHERE cotizacion_id = $2 ORDER BY id`,
        [orden!.id, d.cotizacionId], tx)
      await notificarCliente(cot.cliente_id, {
        titulo: `Orden ${orden!.codigo_orden} creada`,
        mensaje: 'Tu servicio quedó registrado. Para iniciar se requiere el anticipo del 50 %.',
        enlace: `/portal/ordenes/${orden!.id}`,
      }, tx)
      return orden!.id
    }, { usuarioId: req.sesion!.usuarioId })

    res.status(201).json(await detalleOrden(id))
  }),
)

/** HU_47 · Registrar observaciones generales de la orden */
rutasOrdenes.patch(
  '/:id/observaciones',
  permiso('ordenes.registrar_observaciones'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const { observaciones } = z.object({ observaciones: textoOpcional(4000) }).parse(req.body)
    await enTransaccion(async (tx) => {
      const o = await unaFila(`SELECT 1 FROM orden WHERE id = $1`, [id], tx)
      if (!o) throw noEncontrado('esa orden de servicio')
      await consultar(`UPDATE orden SET observaciones = $2 WHERE id = $1`, [id, observaciones], tx)
      await consultar(
        `INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
        [id, `Observación registrada: ${(observaciones ?? '(vacía)').slice(0, 200)}`, req.sesion!.usuarioId], tx)
    })
    res.json(await detalleOrden(id))
  }),
)

/** HU_49 · Cambiar estado de un ítem · CA_47_02 · notas del técnico por ítem */
rutasOrdenes.patch(
  '/:id/items/:itemId',
  permiso('ordenes.cambiar_estado_item', 'ordenes.registrar_observaciones'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const itemId = idRuta.parse(req.params.itemId)
    const d = z
      .object({ estado: z.enum(['pendiente', 'en_proceso', 'completado']).optional(), notas: z.string().trim().max(2000).optional() })
      .parse(req.body)
    const s = req.sesion!
    if (d.estado && !s.permisos.has('ordenes.cambiar_estado_item')) {
      throw regla('SIN_PERMISO', 'Tu rol no puede cambiar el estado de los ítems.')
    }
    await enTransaccion(async (tx) => {
      const item = await unaFila<{ estado_item: string; orden_estado: string; nombre: string }>(
        `SELECT d.estado_item, o.estado AS orden_estado, coalesce(sv.nombre, dc.descripcion) AS nombre
           FROM detalle_orden d JOIN orden o ON o.id = d.orden_id
           JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
           LEFT JOIN servicio sv ON sv.id = dc.servicio_id
          WHERE d.id = $1 AND d.orden_id = $2`,
        [itemId, id], tx)
      if (!item) throw noEncontrado('ese ítem de la orden')
      if (d.estado && ['finalizada', 'cancelada'].includes(item.orden_estado)) {
        throw regla('ORDEN_CERRADA', 'La orden ya está cerrada: sus ítems no cambian de estado.')
      }
      await consultar(
        `UPDATE detalle_orden SET estado_item = coalesce($2, estado_item),
                notas_tecnico = CASE WHEN $4 THEN $3 ELSE notas_tecnico END
          WHERE id = $1`,
        [itemId, d.estado ?? null, d.notas || null, d.notas !== undefined], tx)
      if (d.estado && d.estado !== item.estado_item) {
        await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
          [id, `Ítem «${item.nombre}»: ${item.estado_item.replace('_', ' ')} → ${d.estado.replace('_', ' ')}`, s.usuarioId], tx)
      }
    })
    res.json(await detalleOrden(id))
  }),
)

/** HU_48 · Cambiar estado de la orden */
rutasOrdenes.patch(
  '/:id/estado',
  permiso('ordenes.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = z.object({ estado: z.enum(ESTADOS_ORDEN), motivo: textoOpcional(200) }).parse(req.body)
    await enTransaccion(async (tx) => {
      await cambiarEstadoOrden(tx, id, d.estado, d.motivo ?? `Estado cambiado a «${ETIQUETA_ORDEN[d.estado]}» por administración`)
    }, { usuarioId: req.sesion!.usuarioId })
    res.json(await detalleOrden(id))
  }),
)
