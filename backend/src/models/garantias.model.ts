import type pg from 'pg'
import { z } from 'zod'
import { consultar, enTransaccion, motivo, unaFila } from '../db.js'
import { notificarCliente, notificarConPermiso } from '../utils/avisos.js'
import { iso, listaBase, normalizar, pagina, sinTildes, textoOpcional } from '../utils/comun.js'
import { conflicto, noEncontrado, regla } from '../utils/errores.js'

/**
 * [Feedback 13] Garantías.
 *
 * Nacen solas al finalizar una orden (trigger fn_garantia_orden) con los días
 * del servicio de la orden que más garantía tenga. El cliente las ve en el
 * portal y puede reclamar mientras estén vigentes; RvR aprueba el reclamo
 * (se abre una orden de garantía sin costo) o lo rechaza con una respuesta.
 */


interface FilaGarantia {
  id: number
  orden_id: number
  codigo_orden: string
  cliente_id: number | null
  cliente: string | null
  fecha_inicio: string
  fecha_fin: string
  dias_restantes: number
  servicios: string | null
  reclamo_estado: string | null
  reclamos: number
}

const SELECT = `
  SELECT g.id, g.orden_id, o.codigo_orden, oc.cliente_id, trim(c.nombres || ' ' || c.apellidos) AS cliente,
         g.fecha_inicio::text AS fecha_inicio, g.fecha_fin::text AS fecha_fin,
         (g.fecha_fin - current_date)::int AS dias_restantes,
         (SELECT string_agg(coalesce(s.nombre, dc.descripcion), ', ' ORDER BY dc.id)
            FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
            LEFT JOIN servicio s ON s.id = dc.servicio_id WHERE d.orden_id = g.orden_id) AS servicios,
         (SELECT r.estado FROM reclamo_garantia r WHERE r.garantia_id = g.id ORDER BY r.fecha_reclamo DESC LIMIT 1) AS reclamo_estado,
         (SELECT count(*)::int FROM reclamo_garantia r WHERE r.garantia_id = g.id) AS reclamos
    FROM garantia g
    JOIN orden o ON o.id = g.orden_id
    LEFT JOIN v_orden_cliente oc ON oc.orden_id = g.orden_id
    LEFT JOIN cliente c ON c.id = oc.cliente_id
`

export const aGarantia = (f: FilaGarantia) => ({
  id: f.id,
  orden: { id: f.orden_id, codigo: f.codigo_orden },
  cliente: f.cliente_id ? { id: f.cliente_id, nombre: f.cliente ?? '' } : null,
  fechaInicio: f.fecha_inicio,
  fechaFin: f.fecha_fin,
  diasRestantes: Math.max(f.dias_restantes, 0),
  vigente: f.dias_restantes >= 0,
  servicios: f.servicios ?? '',
  reclamoEstado: f.reclamo_estado,
  reclamos: f.reclamos,
})

async function reclamosDe(garantiaId: number, conexion?: pg.PoolClient) {
  const filas = await consultar<{
    id: number; descripcion: string; estado: string; respuesta: string | null; fecha_reclamo: Date; fecha_respuesta: Date | null
    respondio: string | null; orden_garantia_id: number | null; codigo: string | null
  }>(
    `SELECT r.id, r.descripcion, r.estado, r.respuesta, r.fecha_reclamo, r.fecha_respuesta,
            trim(u.nombres || ' ' || u.apellidos) AS respondio, r.orden_garantia_id, o.codigo_orden AS codigo
       FROM reclamo_garantia r
       LEFT JOIN usuario u ON u.id = r.respondido_por
       LEFT JOIN orden o ON o.id = r.orden_garantia_id
      WHERE r.garantia_id = $1 ORDER BY r.fecha_reclamo DESC`,
    [garantiaId], conexion)
  return filas.map((r) => ({
    id: r.id,
    descripcion: r.descripcion,
    estado: r.estado,
    respuesta: r.respuesta ?? '',
    fecha: iso(r.fecha_reclamo),
    fechaRespuesta: iso(r.fecha_respuesta),
    respondio: r.respondio ?? '',
    ordenGarantia: r.orden_garantia_id ? { id: r.orden_garantia_id, codigo: r.codigo ?? '' } : null,
  }))
}

/** Garantía de una orden (o null) con sus reclamos. La usan el detalle de la orden y el portal. */
export async function garantiaDeOrden(ordenId: number) {
  const f = await unaFila<FilaGarantia>(`${SELECT} WHERE g.orden_id = $1`, [ordenId])
  if (!f) return null
  return { ...aGarantia(f), historialReclamos: await reclamosDe(f.id) }
}

export const filtroGarantias = listaBase.extend({ estado: z.enum(['vigente', 'vencida', 'reclamo']).optional().catch(undefined) })

/** Listado: vigentes, vencidas o con reclamo pendiente. */
export async function listar(p: z.infer<typeof filtroGarantias>) {
  const filas = await consultar<FilaGarantia & { total: number }>(
    `WITH base AS (${SELECT})
     SELECT *, count(*) OVER ()::int AS total FROM base
      WHERE ($1 = '' OR ${sinTildes(`codigo_orden || ' ' || coalesce(cliente, '') || ' ' || coalesce(servicios, '')`)} LIKE '%' || $1 || '%')
        AND ($2::text IS NULL
             OR ($2 = 'vigente' AND dias_restantes >= 0)
             OR ($2 = 'vencida' AND dias_restantes < 0)
             OR ($2 = 'reclamo' AND reclamo_estado = 'pendiente'))
      ORDER BY (reclamo_estado = 'pendiente') DESC NULLS LAST, fecha_fin DESC
      LIMIT $3 OFFSET $4`,
    [normalizar(p.q), p.estado ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
  )
  const conteos = await unaFila<Record<string, number>>(
    `SELECT count(*)::int AS todos,
            count(*) FILTER (WHERE fecha_fin >= current_date)::int AS vigente,
            count(*) FILTER (WHERE fecha_fin < current_date)::int AS vencida,
            (SELECT count(*)::int FROM reclamo_garantia WHERE estado = 'pendiente') AS reclamo
       FROM garantia`,
  )
  return { ...pagina(filas.map(aGarantia), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos }
}

export async function detalle(id: number) {
  const f = await unaFila<FilaGarantia>(`${SELECT} WHERE g.id = $1`, [id])
  if (!f) throw noEncontrado('esa garantía')
  return { ...aGarantia(f), historialReclamos: await reclamosDe(id) }
}

async function reclamoPendiente(tx: pg.PoolClient, id: number) {
  const r = await unaFila<{ estado: string; garantia_id: number; orden_id: number; codigo_orden: string; cliente_id: number | null; descripcion: string }>(
    `SELECT r.estado, r.garantia_id, g.orden_id, o.codigo_orden, oc.cliente_id, r.descripcion
       FROM reclamo_garantia r
       JOIN garantia g ON g.id = r.garantia_id
       JOIN orden o ON o.id = g.orden_id
       LEFT JOIN v_orden_cliente oc ON oc.orden_id = g.orden_id
      WHERE r.id = $1 FOR UPDATE OF r`, [id], tx)
  if (!r) throw noEncontrado('ese reclamo')
  if (r.estado !== 'pendiente') throw conflicto('YA_RESPONDIDO', `Ese reclamo ya fue ${r.estado}.`)
  return r
}


export const datosAprobar = z.object({ respuesta: textoOpcional(255) })

/**
 * Aprobar: se abre una orden de garantía, sin costo, con los mismos ítems de
 * la orden original. Pasa por una cotización aprobada en $0 para que la orden
 * quede ligada al cliente igual que cualquier otra (v_orden_cliente).
 */
export async function aprobarReclamo(id: number, respuesta: string | null, usuarioId: number) {
  return enTransaccion(async (tx) => {
    const rec = await reclamoPendiente(tx, id)
    if (!rec.cliente_id) throw regla('SIN_CLIENTE', 'La orden original no tiene cliente.')
    const original = await unaFila<{ direccion: string | null }>(
      `SELECT q.direccion FROM v_orden_cliente oc JOIN cotizacion q ON q.id = oc.cotizacion_id WHERE oc.orden_id = $1`, [rec.orden_id], tx)
    const cot = await unaFila<{ id: number }>(
      `INSERT INTO cotizacion (cliente_id, estado, origen, descripcion, direccion, fecha_envio, fecha_respuesta, respondida_por)
       VALUES ($1, 'aprobada', 'administrador', $2, $3, now(), now(), $4) RETURNING id`,
      [rec.cliente_id, `Garantía de la orden ${rec.codigo_orden}: ${rec.descripcion}`.slice(0, 2000), original?.direccion ?? null, usuarioId], tx)
    await consultar(
      `INSERT INTO detalle_cotizacion (cotizacion_id, servicio_id, cantidad, precio_unitario, tipo_item, descripcion)
       SELECT $1, dc.servicio_id, dc.cantidad, 0, dc.tipo_item, coalesce(dc.descripcion, 'Garantía')
         FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
        WHERE d.orden_id = $2 ORDER BY dc.id`,
      [cot!.id, rec.orden_id], tx)
    await motivo(tx, `Orden de garantía de ${rec.codigo_orden}`)
    const orden = await unaFila<{ id: number; codigo_orden: string }>(
      `INSERT INTO orden (estado, observaciones) VALUES ('en_proceso', $1) RETURNING id, codigo_orden`,
      [`Garantía de la orden ${rec.codigo_orden}. Sin costo para el cliente.`], tx)
    await consultar(
      `INSERT INTO detalle_orden (orden_id, detalle_cotizacion_id, estado_item)
       SELECT $1, id, 'pendiente' FROM detalle_cotizacion WHERE cotizacion_id = $2 ORDER BY id`,
      [orden!.id, cot!.id], tx)
    await consultar(
      `UPDATE reclamo_garantia SET estado = 'aprobado', respuesta = $2, respondido_por = $3, fecha_respuesta = now(), orden_garantia_id = $4
        WHERE id = $1`,
      [id, respuesta ?? 'Aprobado: abrimos una orden de garantía sin costo.', usuarioId, orden!.id], tx)
    await notificarCliente(rec.cliente_id, {
      titulo: 'Reclamo de garantía aprobado',
      mensaje: `Abrimos la orden ${orden!.codigo_orden} para atender la garantía de ${rec.codigo_orden}, sin costo. Te avisaremos cuando agendemos la visita.`,
      enlace: `/portal/ordenes/${orden!.id}`,
    }, tx)
    return { ordenId: orden!.id, codigo: orden!.codigo_orden, garantiaId: rec.garantia_id }
  }, { usuarioId })
}

export const datosRechazo = z.object({
  respuesta: z.string({ error: 'Escribe la respuesta para el cliente' }).trim().min(5, 'Escribe la respuesta para el cliente (mínimo 5 caracteres)').max(255),
})

export async function rechazarReclamo(id: number, respuesta: string, usuarioId: number) {
  return enTransaccion(async (tx) => {
    const rec = await reclamoPendiente(tx, id)
    await consultar(
      `UPDATE reclamo_garantia SET estado = 'rechazado', respuesta = $2, respondido_por = $3, fecha_respuesta = now() WHERE id = $1`,
      [id, respuesta, usuarioId], tx)
    if (rec.cliente_id) {
      await notificarCliente(rec.cliente_id, {
        titulo: 'Reclamo de garantía no aprobado',
        mensaje: `Sobre la garantía de ${rec.codigo_orden}: ${respuesta}`,
        enlace: `/portal/ordenes/${rec.orden_id}`,
      }, tx)
    }
    return { garantiaId: rec.garantia_id }
  })
}

/** Lo usa el portal: el cliente reclama la garantía de su orden. */
export async function reclamarGarantia(ordenId: number, descripcion: string) {
  return enTransaccion(async (tx) => {
    const g = await unaFila<{ id: number; vigente: boolean; codigo_orden: string }>(
      `SELECT g.id, g.fecha_fin >= current_date AS vigente, o.codigo_orden
         FROM garantia g JOIN orden o ON o.id = g.orden_id WHERE g.orden_id = $1`, [ordenId], tx)
    if (!g) throw regla('SIN_GARANTIA', 'Esta orden no tiene garantía.')
    if (!g.vigente) throw regla('GARANTIA_VENCIDA', 'La garantía de esta orden ya venció.')
    if (await unaFila(`SELECT 1 FROM reclamo_garantia WHERE garantia_id = $1 AND estado = 'pendiente'`, [g.id], tx)) {
      throw conflicto('RECLAMO_ABIERTO', 'Ya tienes un reclamo en revisión para esta orden.')
    }
    const r = await unaFila<{ id: number }>(
      `INSERT INTO reclamo_garantia (garantia_id, descripcion) VALUES ($1, $2) RETURNING id`, [g.id, descripcion], tx)
    await notificarConPermiso('ordenes.gestionar_garantias', {
      titulo: 'Nuevo reclamo de garantía',
      mensaje: `El cliente reclamó la garantía de la orden ${g.codigo_orden}.`,
      enlace: `/garantias?id=${g.id}`,
    }, tx)
    return r!.id
  })
}
