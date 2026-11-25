import { z } from 'zod'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { notificarCliente, notificarConPermiso } from '../utils/avisos.js'
import { filtroOpcional, iso, listaBase, normalizar, pagina, sinTildes, textoOpcional } from '../utils/comun.js'
import { conflicto, noEncontrado, regla } from '../utils/errores.js'
import { describirDetalle, detallePago, limpiarDetalle, METODOS_PAGO, revisarPago, type DetallePago } from '../utils/pagos.js'
import { registrarAbono } from './ventas.model.js'

/**
 * [Feedback 12] Comprobantes de pago.
 *
 * El cliente sube desde el portal la foto o el PDF de su pago. No descuenta
 * saldo: queda «pendiente» hasta que alguien de RvR lo revisa. Al aprobarlo se
 * registra el abono (con todas las reglas de HU_58); al rechazarlo, el cliente
 * recibe el motivo y puede enviar otro.
 */

export const TIPOS_ARCHIVO = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
/** ~3 MB de archivo son ~4 millones de caracteres en base64. */
const MAX_DATA_URL = 4_200_000

const formatoCop = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const datosComprobante = z.object({
  monto: z.coerce.number({ error: 'El monto debe ser un número' }).positive('El monto debe ser mayor que cero'),
  metodoPago: z.enum(METODOS_PAGO, { error: 'Selecciona el método de pago' }),
  referencia: textoOpcional(100),
  detalle: detallePago.nullable().optional(),
  archivo: z
    .object({
      nombre: z.string().trim().min(1).max(150),
      tipo: z.enum(TIPOS_ARCHIVO, { error: 'Sube una imagen (JPG, PNG o WEBP) o un PDF' }),
      datos: z.string().max(MAX_DATA_URL, 'El archivo supera los 3 MB'),
    }, { error: 'Adjunta la foto o el PDF del comprobante' })
    .refine((a) => a.datos.startsWith(`data:${a.tipo};base64,`), { message: 'El archivo no es válido', path: ['datos'] }),
})
  .superRefine((d, ctx) => {
    // Reporte por referencia y archivo; los clientes anteriores envían además datos del método.
    if (d.detalle || !d.referencia?.trim()) revisarPago(d, ctx)
  })
  .transform((d) => ({ ...d, detalle: limpiarDetalle(d.metodoPago, d.detalle) }))

/** Lo usa el portal: guarda el comprobante de una venta del cliente. */
export async function guardarComprobante(ventaId: number, usuarioId: number, d: z.infer<typeof datosComprobante>) {
  return enTransaccion(async (tx) => {
    const v = await unaFila<{ saldo: number; estado_pago: string; orden_id: number; codigo_orden: string; pendiente: number; pendientes: number }>(
      `SELECT v.saldo, v.estado_pago, v.orden_id, o.codigo_orden,
              (SELECT coalesce(sum(monto), 0) FROM comprobante_pago WHERE venta_id = v.id AND estado = 'pendiente') AS pendiente,
              (SELECT count(*)::int FROM comprobante_pago WHERE venta_id = v.id AND estado = 'pendiente') AS pendientes
         FROM v_ventas v JOIN orden o ON o.id = v.orden_id WHERE v.id = $1`, [ventaId], tx)
    if (!v) throw noEncontrado('esa venta')
    if (v.estado_pago === 'anulada') throw regla('VENTA_ANULADA', 'La venta de esta orden está anulada.')
    if (v.saldo <= 0) throw regla('SIN_SALDO', 'Esta orden ya está pagada.')
    if (v.pendientes >= 3) throw regla('MUCHOS_PENDIENTES', 'Ya tienes 3 comprobantes en revisión para esta orden. Espera a que los revisemos.')
    const disponible = v.saldo - v.pendiente
    if (d.monto > disponible) {
      throw regla('SUPERA_SALDO', `El monto supera lo que falta por pagar${v.pendiente > 0 ? ' descontando los comprobantes en revisión' : ''} (${formatoCop(disponible)}).`,
        { detalles: [{ campo: 'monto', mensaje: `Máximo ${formatoCop(disponible)}` }] })
    }
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO comprobante_pago (venta_id, monto, metodo_pago, referencia, detalle_pago, archivo, archivo_nombre, archivo_tipo, enviado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [ventaId, d.monto, d.metodoPago, d.referencia, d.detalle ? JSON.stringify(d.detalle) : null, d.archivo.datos, d.archivo.nombre, d.archivo.tipo, usuarioId], tx)
    await notificarConPermiso('abonos.revisar_comprobantes', {
      titulo: 'Comprobante de pago por revisar',
      mensaje: `El cliente envió un pago de ${formatoCop(d.monto)} (${d.metodoPago}) para la orden ${v.codigo_orden}.`,
      enlace: `/comprobantes?id=${fila!.id}`,
    }, tx)
    return fila!.id
  })
}

interface FilaComprobante {
  id: number
  venta_id: number
  orden_id: number
  codigo_orden: string
  cliente_id: number | null
  cliente: string | null
  monto: number
  metodo_pago: string
  referencia: string | null
  detalle_pago: DetallePago | null
  archivo_nombre: string
  archivo_tipo: string
  estado: string
  motivo_rechazo: string | null
  fecha_envio: Date
  fecha_revision: Date | null
  revisor: string | null
  abono_id: number | null
  saldo: number
  monto_total: number
  monto_anticipo: number
  abonado: number
  estado_pago: string
}

const SELECT = `
  SELECT cp.id, cp.venta_id, v.orden_id, o.codigo_orden, v.cliente_id, trim(c.nombres || ' ' || c.apellidos) AS cliente,
         cp.monto, cp.metodo_pago, cp.referencia, cp.detalle_pago, cp.archivo_nombre, cp.archivo_tipo, cp.estado, cp.motivo_rechazo,
         cp.fecha_envio, cp.fecha_revision, trim(u.nombres || ' ' || u.apellidos) AS revisor, cp.abono_id,
         v.saldo, v.monto_total, v.monto_anticipo, v.abonado, v.estado_pago
    FROM comprobante_pago cp
    JOIN v_ventas v ON v.id = cp.venta_id
    JOIN orden o ON o.id = v.orden_id
    LEFT JOIN cliente c ON c.id = v.cliente_id
    LEFT JOIN usuario u ON u.id = cp.revisado_por
`

export const aComprobante = (f: FilaComprobante) => ({
  id: f.id,
  ventaId: f.venta_id,
  orden: { id: f.orden_id, codigo: f.codigo_orden },
  cliente: f.cliente_id ? { id: f.cliente_id, nombre: f.cliente ?? '' } : null,
  monto: f.monto,
  metodo: f.metodo_pago,
  referencia: f.referencia ?? '',
  detalle: describirDetalle(f.metodo_pago, f.detalle_pago),
  archivo: { nombre: f.archivo_nombre, tipo: f.archivo_tipo },
  estado: f.estado,
  motivoRechazo: f.motivo_rechazo ?? '',
  fechaEnvio: iso(f.fecha_envio),
  fechaRevision: iso(f.fecha_revision),
  revisor: f.revisor ?? '',
  abonoId: f.abono_id,
  venta: { montoTotal: f.monto_total, montoAnticipo: f.monto_anticipo, abonado: f.abonado, saldo: f.saldo, estadoPago: f.estado_pago },
})

export const filtroComprobantes = listaBase.extend({ estado: filtroOpcional(['pendiente', 'aprobado', 'rechazado'] as const) })

/** Bandeja de comprobantes, con los pendientes primero. */
export async function listar(p: z.infer<typeof filtroComprobantes>) {
  const filas = await consultar<FilaComprobante & { total: number }>(
    `WITH base AS (${SELECT})
     SELECT *, count(*) OVER ()::int AS total FROM base
      WHERE ($1 = '' OR ${sinTildes(`codigo_orden || ' ' || coalesce(cliente, '') || ' ' || coalesce(referencia, '')`)} LIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR estado = $2)
      ORDER BY (estado = 'pendiente') DESC, fecha_envio DESC
      LIMIT $3 OFFSET $4`,
    [normalizar(p.q), p.estado ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
  )
  const conteos = await unaFila<Record<string, number>>(
    `SELECT count(*)::int AS todos,
            count(*) FILTER (WHERE estado = 'pendiente')::int AS pendiente,
            count(*) FILTER (WHERE estado = 'aprobado')::int AS aprobado,
            count(*) FILTER (WHERE estado = 'rechazado')::int AS rechazado
       FROM comprobante_pago`,
  )
  return { ...pagina(filas.map(aComprobante), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos }
}

/** Detalle con el archivo, para verlo al lado de los datos. */
export async function detalle(id: number) {
  const f = await unaFila<FilaComprobante & { archivo: string }>(
    `SELECT b.*, cp.archivo FROM (${SELECT}) b JOIN comprobante_pago cp ON cp.id = b.id WHERE b.id = $1`, [id])
  if (!f) throw noEncontrado('ese comprobante')
  return { ...aComprobante(f), archivo: { nombre: f.archivo_nombre, tipo: f.archivo_tipo, datos: f.archivo } }
}

async function bloquearPendiente(tx: Parameters<Parameters<typeof enTransaccion>[0]>[0], id: number) {
  const c = await unaFila<{ estado: string; venta_id: number; monto: number; metodo_pago: string; referencia: string | null; detalle_pago: DetallePago | null }>(
    `SELECT estado, venta_id, monto, metodo_pago, referencia, detalle_pago FROM comprobante_pago WHERE id = $1 FOR UPDATE`, [id], tx)
  if (!c) throw noEncontrado('ese comprobante')
  if (c.estado !== 'pendiente') throw conflicto('YA_REVISADO', `Ese comprobante ya fue ${c.estado}.`)
  return c
}

/** Aprobar: se registra el abono y el saldo baja. */
export async function aprobar(id: number, usuarioId: number) {
  const r = await enTransaccion(async (tx) => {
    const c = await bloquearPendiente(tx, id)
    const venta = await unaFila<{ estado_pago: string }>(`SELECT estado_pago FROM ventas WHERE id = $1`, [c.venta_id], tx)
    const abono = await registrarAbono(tx, {
      ventaId: c.venta_id,
      monto: c.monto,
      tipoAbono: venta?.estado_pago === 'pendiente_anticipo' ? 'anticipo' : 'saldo',
      metodoPago: c.metodo_pago as (typeof METODOS_PAGO)[number],
      referencia: c.referencia,
      detalle: c.detalle_pago,
      origen: 'comprobante del cliente',
    }, usuarioId)
    await consultar(
      `UPDATE comprobante_pago SET estado = 'aprobado', abono_id = $2, revisado_por = $3, fecha_revision = now() WHERE id = $1`,
      [id, abono.abonoId, usuarioId], tx)
    return abono
  }, { usuarioId })
  return { ...(await detalle(id)), ordenEnProceso: r.ordenEnProceso }
}

export const datosRechazo = z.object({
  motivo: z.string({ error: 'Escribe el motivo del rechazo' }).trim().min(5, 'Escribe el motivo del rechazo (mínimo 5 caracteres)').max(255),
})

/** Rechazar con el motivo, que le llega al cliente. */
export async function rechazar(id: number, motivo: string, usuarioId: number) {
  await enTransaccion(async (tx) => {
    await bloquearPendiente(tx, id)
    await consultar(
      `UPDATE comprobante_pago SET estado = 'rechazado', motivo_rechazo = $2, revisado_por = $3, fecha_revision = now() WHERE id = $1`,
      [id, motivo, usuarioId], tx)
    const c = await unaFila<{ cliente_id: number | null; orden_id: number; codigo_orden: string; monto: number }>(
      `SELECT v.cliente_id, v.orden_id, o.codigo_orden, cp.monto FROM comprobante_pago cp
         JOIN v_ventas v ON v.id = cp.venta_id JOIN orden o ON o.id = v.orden_id WHERE cp.id = $1`, [id], tx)
    if (c?.cliente_id) {
      await notificarCliente(c.cliente_id, {
        titulo: 'Comprobante de pago rechazado',
        mensaje: `Tu comprobante de ${formatoCop(c.monto)} para la orden ${c.codigo_orden} no fue aprobado: ${motivo}`,
        enlace: `/portal/ordenes/${c.orden_id}`,
      }, tx)
    }
  })
  return detalle(id)
}
