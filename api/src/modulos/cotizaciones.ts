import { Router } from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { notificarCliente, notificarConPermiso, notificarUsuario } from '../avisos.js'
import {
  filtroOpcional, idRuta, iso, listaBase, normalizar, numeroCotizacion, pagina, rangoFechas, sinTildes, textoOpcional,
} from '../comun.js'
import { consultar, enTransaccion, motivo, pool, unaFila, type Conexion } from '../db.js'
import { asincrono, noEncontrado, regla } from '../errores.js'

/**
 * Venta – Órdenes · Gestión de Cotizaciones (HU_36 – HU_41, HU_81).
 * Maestro-detalle: `cotizacion` + `detalle_cotizacion` (servicios y repuestos).
 */
export const rutasCotizaciones = Router()
rutasCotizaciones.use(sesion)

export const ESTADOS_COTIZACION = ['solicitada', 'pendiente', 'aprobada', 'rechazada'] as const

// ------------------------------------------------------------ lectura común

interface FilaCot {
  id: number
  cliente_id: number
  cliente: string
  documento: string
  telefono: string | null
  correo: string | null
  cliente_direccion: string | null
  cliente_usuario: number | null
  fecha_cotizacion: Date
  monto_total: number
  estado: string
  fecha_envio: Date | null
  fecha_respuesta: Date | null
  motivo_rechazo: string | null
  origen: string
  descripcion: string | null
  direccion: string | null
  orden_id: number | null
  orden_origen_codigo: string | null
  respondida_por: string | null
  orden_generada_id: number | null
  orden_generada_codigo: string | null
  items: number
}

const SELECT_COT = `
  SELECT q.id, q.cliente_id, trim(c.nombres || ' ' || c.apellidos) AS cliente, c.documento_identidad AS documento,
         c.telefono, c.correo, c.direccion AS cliente_direccion, c.usuario_id AS cliente_usuario,
         q.fecha_cotizacion, q.monto_total, q.estado, q.fecha_envio, q.fecha_respuesta, q.motivo_rechazo,
         q.origen, q.descripcion, q.direccion, q.orden_id, oo.codigo_orden AS orden_origen_codigo,
         trim(u.nombres || ' ' || u.apellidos) AS respondida_por,
         og.id AS orden_generada_id, og.codigo_orden AS orden_generada_codigo,
         (SELECT count(*) FROM detalle_cotizacion dc WHERE dc.cotizacion_id = q.id)::int AS items
    FROM cotizacion q
    JOIN cliente c       ON c.id = q.cliente_id
    LEFT JOIN usuario u  ON u.id = q.respondida_por
    LEFT JOIN orden oo   ON oo.id = q.orden_id
    LEFT JOIN LATERAL (
      SELECT o.id, o.codigo_orden FROM detalle_cotizacion dc
        JOIN detalle_orden d ON d.detalle_cotizacion_id = dc.id
        JOIN orden o ON o.id = d.orden_id
       WHERE dc.cotizacion_id = q.id LIMIT 1) og ON true
`

const aResumen = (f: FilaCot) => ({
  id: f.id,
  numero: numeroCotizacion(f.id),
  cliente: { id: f.cliente_id, nombre: f.cliente, documento: f.documento },
  fecha: iso(f.fecha_cotizacion),
  montoTotal: f.monto_total,
  estado: f.estado,
  origen: f.origen,
  items: f.items,
  fechaEnvio: iso(f.fecha_envio),
  orden: f.orden_generada_id ? { id: f.orden_generada_id, codigo: f.orden_generada_codigo } : null,
  ordenOrigen: f.orden_id ? { id: f.orden_id, codigo: f.orden_origen_codigo } : null,
})

export async function detalleCotizacion(id: number, conexion: Conexion = pool) {
  const f = await unaFila<FilaCot>(`${SELECT_COT} WHERE q.id = $1`, [id], conexion)
  if (!f) throw noEncontrado('esa cotización')
  const items = await consultar<{
    id: number; tipo_item: string; servicio_id: number | null; servicio: string | null; categoria: string | null
    descripcion: string | null; cantidad: number; precio_unitario: number; subtotal: number; precio_actual: number | null
  }>(
    `SELECT dc.id, dc.tipo_item, dc.servicio_id, s.nombre AS servicio, s.categoria, dc.descripcion,
            dc.cantidad, dc.precio_unitario, dc.subtotal, s.precio_base AS precio_actual
       FROM detalle_cotizacion dc
       LEFT JOIN servicio s ON s.id = dc.servicio_id
      WHERE dc.cotizacion_id = $1
      ORDER BY dc.tipo_item DESC, dc.id`,
    [id],
    conexion,
  )
  return {
    ...aResumen(f),
    cliente: {
      id: f.cliente_id, nombre: f.cliente, documento: f.documento, telefono: f.telefono ?? '',
      correo: f.correo ?? '', direccion: f.cliente_direccion ?? '', tieneCuenta: f.cliente_usuario !== null,
    },
    descripcion: f.descripcion ?? '',
    direccion: f.direccion ?? '',
    fechaRespuesta: iso(f.fecha_respuesta),
    motivoRechazo: f.motivo_rechazo ?? '',
    respondidaPor: f.respondida_por,
    detalle: items.map((i) => ({
      id: i.id,
      tipo: i.tipo_item as 'servicio' | 'repuesto',
      servicioId: i.servicio_id,
      nombre: i.tipo_item === 'servicio' ? (i.servicio ?? 'Servicio') : (i.descripcion ?? 'Repuesto'),
      categoria: i.categoria ?? '',
      descripcion: i.descripcion ?? '',
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      subtotal: i.subtotal,
      precioActual: i.precio_actual,
    })),
    editable: f.estado === 'solicitada' || f.estado === 'pendiente',
    valorada: items.length > 0 && items.every((i) => i.precio_unitario > 0),
  }
}

// ------------------------------------------------------- escritura común

export const itemCotizacion = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('servicio'),
    servicioId: z.coerce.number().int().positive('Selecciona el servicio'),
    cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').max(999),
  }),
  z.object({
    tipo: z.literal('repuesto'),
    descripcion: z.string().trim().min(2, 'Describe el repuesto o insumo').max(255),
    cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').max(999),
    precioUnitario: z.coerce.number().min(0, 'El precio no puede ser negativo').max(99_999_999),
  }),
])
export type ItemCotizacion = z.infer<typeof itemCotizacion>

/**
 * Guarda el detalle de una cotización.
 *
 * CA_36_03 · el precio de los servicios se copia del precio base al cotizar y
 * queda fijo: un servicio que ya estaba en la cotización con precio conserva
 * el suyo aunque el catálogo haya cambiado (CA_18_03). Los repuestos llevan
 * el precio digitado. CA_19_02 · solo servicios activos entran nuevos.
 * `valorar = false` (solicitud del cliente): servicios en 0, sin valores.
 */
export async function guardarDetalle(
  tx: pg.PoolClient,
  cotizacionId: number,
  items: ItemCotizacion[],
  valorar: boolean,
) {
  const previos = await consultar<{ servicio_id: number; precio_unitario: number }>(
    `SELECT servicio_id, precio_unitario FROM detalle_cotizacion WHERE cotizacion_id = $1 AND servicio_id IS NOT NULL`,
    [cotizacionId],
    tx,
  )
  const precioPrevio = new Map(previos.map((p) => [p.servicio_id, p.precio_unitario]))

  const ids = items.filter((i) => i.tipo === 'servicio').map((i) => (i as { servicioId: number }).servicioId)
  const servicios = await consultar<{ id: number; precio_base: number; estado: string; nombre: string }>(
    `SELECT id, precio_base, estado, nombre FROM servicio WHERE id = ANY($1::int[])`,
    [ids],
    tx,
  )
  const porId = new Map(servicios.map((s) => [s.id, s]))

  await consultar(`DELETE FROM detalle_cotizacion WHERE cotizacion_id = $1`, [cotizacionId], tx)
  for (const item of items) {
    if (item.tipo === 'servicio') {
      const s = porId.get(item.servicioId)
      if (!s) throw regla('SERVICIO_INEXISTENTE', 'Uno de los servicios no existe.')
      const previo = precioPrevio.get(item.servicioId)
      if (s.estado !== 'activo' && previo === undefined) {
        throw regla('SERVICIO_INACTIVO', `«${s.nombre}» está inactivo: no se puede agregar a una cotización nueva.`)
      }
      const precio = !valorar ? 0 : previo && previo > 0 ? previo : s.precio_base
      await consultar(
        `INSERT INTO detalle_cotizacion (cotizacion_id, servicio_id, cantidad, precio_unitario, tipo_item)
         VALUES ($1, $2, $3, $4, 'servicio')`,
        [cotizacionId, item.servicioId, item.cantidad, precio],
        tx,
      )
    } else {
      await consultar(
        `INSERT INTO detalle_cotizacion (cotizacion_id, servicio_id, cantidad, precio_unitario, tipo_item, descripcion)
         VALUES ($1, NULL, $2, $3, 'repuesto', $4)`,
        [cotizacionId, item.cantidad, valorar ? item.precioUnitario : 0, item.descripcion],
        tx,
      )
    }
  }
}

/**
 * Registra la decisión del cliente sobre una cotización enviada.
 * Lo usan el administrador (HU_40, decisión por teléfono o WhatsApp) y el
 * cliente desde su portal (HU_80).
 */
export async function registrarDecision(
  id: number,
  decision: 'aprobada' | 'rechazada',
  motivoRechazo: string | null,
  usuarioId: number,
  quien: 'cliente' | 'administrador',
) {
  return enTransaccion(async (tx) => {
    const cot = await unaFila<{ estado: string; orden_id: number | null; cliente_id: number; monto_total: number }>(
      `SELECT estado, orden_id, cliente_id, monto_total FROM cotizacion WHERE id = $1 FOR UPDATE`,
      [id],
      tx,
    )
    if (!cot) throw noEncontrado('esa cotización')
    // CA_40_02 / CA_80_01 · solo sobre cotizaciones enviadas (pendientes)
    // CA_80_05 · una decisión registrada no se cambia
    if (cot.estado !== 'pendiente') {
      throw regla('ESTADO_INVALIDO',
        cot.estado === 'solicitada'
          ? 'La cotización aún no ha sido enviada al cliente.'
          : `La cotización ya fue ${cot.estado}: la decisión no se puede cambiar.`)
    }

    await consultar(
      `UPDATE cotizacion SET estado = $2, fecha_respuesta = now(), motivo_rechazo = $3, respondida_por = $4 WHERE id = $1`,
      [id, decision, decision === 'rechazada' ? motivoRechazo : null, usuarioId],
      tx,
    )

    // Recotización por repuesto (Móvil HU_11): la decisión mueve la orden.
    if (cot.orden_id) {
      const orden = await unaFila<{ estado: string; codigo_orden: string }>(
        `SELECT estado, codigo_orden FROM orden WHERE id = $1 FOR UPDATE`, [cot.orden_id], tx)
      if (decision === 'aprobada') {
        // Los ítems aprobados pasan a la misma orden y la venta crece (CA_55_01:
        // el total de la venta es el de las cotizaciones aprobadas asociadas).
        await consultar(
          `INSERT INTO detalle_orden (orden_id, detalle_cotizacion_id, estado_item)
           SELECT $1, dc.id, 'pendiente' FROM detalle_cotizacion dc WHERE dc.cotizacion_id = $2`,
          [cot.orden_id, id],
          tx,
        )
        await consultar(
          `UPDATE ventas v
              SET monto_total = v.monto_total + $2,
                  saldo_pendiente = v.monto_total + $2 - coalesce((SELECT sum(monto) FROM abonos a WHERE a.venta_id = v.id), 0),
                  estado_pago = CASE WHEN v.estado_pago = 'pagada' THEN 'abonada' ELSE v.estado_pago END
            WHERE v.orden_id = $1 AND v.estado_pago <> 'anulada'`,
          [cot.orden_id, cot.monto_total],
          tx,
        )
      }
      if (orden?.estado === 'en_espera_repuesto') {
        await motivo(tx, decision === 'aprobada'
          ? `El cliente aprobó la recotización ${numeroCotizacion(id)}: el repuesto se agregó a la orden`
          : `El cliente rechazó la recotización ${numeroCotizacion(id)}: la orden sigue sin el repuesto`)
        await consultar(`UPDATE orden SET estado = 'en_proceso' WHERE id = $1`, [cot.orden_id], tx)
      }
      // Móvil CA_11_04 · el técnico se entera de la respuesta
      const tecnico = await unaFila<{ usuario_id: number | null }>(
        `SELECT t.usuario_id FROM agendamiento a JOIN tecnico t ON t.id = a.tecnico_id
          WHERE a.orden_id = $1 ORDER BY a.fecha_programada DESC LIMIT 1`,
        [cot.orden_id],
        tx,
      )
      await notificarUsuario(tecnico?.usuario_id, {
        titulo: decision === 'aprobada' ? 'Repuesto aprobado' : 'Repuesto rechazado',
        mensaje: `El cliente ${decision === 'aprobada' ? 'aprobó' : 'rechazó'} la recotización de la orden ${orden?.codigo_orden ?? ''}.`,
        enlace: `/movil/ordenes/${cot.orden_id}`,
      }, tx)
    }

    // CA_80_03 · al aprobar desde el portal se notifica al administrador
    if (quien === 'cliente') {
      await notificarConPermiso('cotizaciones.ver_detalle', {
        titulo: decision === 'aprobada' ? 'Cotización aprobada' : 'Cotización rechazada',
        mensaje: `El cliente ${decision === 'aprobada' ? 'aprobó' : 'rechazó'} la cotización ${numeroCotizacion(id)}` +
          (decision === 'aprobada' && !cot.orden_id ? '. Ya puedes generar la orden de servicio.' : '.'),
        enlace: `/cotizaciones/${id}`,
      }, tx)
    } else {
      await notificarCliente(cot.cliente_id, {
        titulo: `Cotización ${decision}`,
        mensaje: `Registramos tu decisión sobre la cotización ${numeroCotizacion(id)}.`,
        enlace: `/portal/cotizaciones/${id}`,
      }, tx)
    }
    return detalleCotizacion(id, tx)
  }, { usuarioId })
}

// ----------------------------------------------------------------- rutas

/** HU_38 listar · HU_37 buscar por cliente, fecha o estado */
rutasCotizaciones.get(
  '/',
  permiso('cotizaciones.listar', 'cotizaciones.buscar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .merge(rangoFechas)
      .extend({
        estado: filtroOpcional(ESTADOS_COTIZACION),
        origen: filtroOpcional(['cliente', 'administrador', 'tecnico'] as const),
        cliente: z.coerce.number().int().positive().optional().catch(undefined),
      })
      .parse(req.query)
    const numero = Number(p.q.replace(/\D/g, '')) || 0
    const filas = await consultar<FilaCot & { total: number }>(
      `WITH base AS (${SELECT_COT})
       SELECT *, count(*) OVER ()::int AS total FROM base
        WHERE ($1 = '' OR ${sinTildes(`cliente || ' ' || documento`)} LIKE '%' || $1 || '%' OR id = $2)
          AND ($3::text IS NULL OR estado = $3)
          AND ($4::text IS NULL OR origen = $4)
          AND ($5::int IS NULL OR cliente_id = $5)
          AND ($6::date IS NULL OR fecha_cotizacion >= $6::date)
          AND ($7::date IS NULL OR fecha_cotizacion < $7::date + 1)
        ORDER BY (estado = 'solicitada') DESC, fecha_cotizacion DESC
        LIMIT $8 OFFSET $9`,
      [normalizar(p.q), numero, p.estado ?? null, p.origen ?? null, p.cliente ?? null, p.desde ?? null, p.hasta ?? null,
        p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'solicitada')::int AS solicitada,
              count(*) FILTER (WHERE estado = 'pendiente')::int  AS pendiente,
              count(*) FILTER (WHERE estado = 'aprobada')::int   AS aprobada,
              count(*) FILTER (WHERE estado = 'rechazada')::int  AS rechazada,
              count(*) FILTER (WHERE estado = 'solicitada' AND origen IN ('cliente', 'tecnico'))::int AS por_valorar
         FROM cotizacion`,
    )
    res.json({ ...pagina(filas.map(aResumen), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos })
  }),
)

/** HU_41 · Ver detalle */
rutasCotizaciones.get(
  '/:id',
  permiso('cotizaciones.ver_detalle', 'cotizaciones.editar'),
  asincrono(async (req, res) => {
    res.json(await detalleCotizacion(idRuta.parse(req.params.id)))
  }),
)

const datosCotizacion = z.object({
  clienteId: z.coerce.number({ error: 'Selecciona el cliente' }).int().positive('Selecciona el cliente'),
  descripcion: textoOpcional(2000),
  direccion: textoOpcional(150),
  items: z.array(itemCotizacion).min(1, 'Agrega al menos un servicio o repuesto').max(50),
})

/** HU_36 · Registrar cotización (desde cero). Nace «solicitada» (CA_36_05). */
rutasCotizaciones.post(
  '/',
  permiso('cotizaciones.registrar'),
  asincrono(async (req, res) => {
    const d = datosCotizacion.parse(req.body)
    const cliente = await unaFila<{ estado: string; direccion: string | null }>(
      `SELECT estado, direccion FROM cliente WHERE id = $1`, [d.clienteId])
    if (!cliente) throw noEncontrado('ese cliente')
    // CA_83_02 · un cliente inactivo no se asocia a cotizaciones nuevas
    if (cliente.estado !== 'activo') throw regla('CLIENTE_INACTIVO', 'El cliente está inactivo: no puede recibir cotizaciones nuevas.')

    const id = await enTransaccion(async (tx) => {
      const fila = await unaFila<{ id: number }>(
        `INSERT INTO cotizacion (cliente_id, estado, origen, descripcion, direccion)
         VALUES ($1, 'solicitada', 'administrador', $2, $3) RETURNING id`,
        [d.clienteId, d.descripcion, d.direccion ?? cliente.direccion],
        tx,
      )
      await guardarDetalle(tx, fila!.id, d.items, true)
      return fila!.id
    })
    res.status(201).json(await detalleCotizacion(id))
  }),
)

/**
 * HU_39 · Editar (valorar una solicitud también es editarla).
 * CA_39_02 · solo «solicitada» o «pendiente».
 * CA_39_04 · si ya se había enviado, vuelve a «solicitada» y hay que reenviarla.
 */
rutasCotizaciones.put(
  '/:id',
  permiso('cotizaciones.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = datosCotizacion.omit({ clienteId: true }).parse(req.body)
    const actual = await detalleCotizacion(id)
    if (!actual.editable) {
      throw regla('NO_EDITABLE', `Una cotización ${actual.estado} no se puede editar.`)
    }
    const requiereReenvio = actual.estado === 'pendiente'
    await enTransaccion(async (tx) => {
      await consultar(
        `UPDATE cotizacion SET descripcion = $2, direccion = $3,
                estado = 'solicitada'
          WHERE id = $1`,
        [id, d.descripcion, d.direccion],
        tx,
      )
      await guardarDetalle(tx, id, d.items, true)
    })
    res.json({ ...(await detalleCotizacion(id)), requiereReenvio })
  }),
)

/** HU_81 · Enviar la cotización al cliente */
rutasCotizaciones.post(
  '/:id/enviar',
  permiso('cotizaciones.enviar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const actual = await detalleCotizacion(id)
    // CA_81_04 · aprobada o rechazada no se reenvía
    if (!actual.editable) throw regla('ESTADO_INVALIDO', `Una cotización ${actual.estado} no se puede enviar nuevamente.`)
    // CA_81_01 · valorada, con ítems y total mayor que cero
    if (actual.detalle.length === 0) throw regla('SIN_ITEMS', 'La cotización no tiene ítems.')
    if (!actual.valorada || actual.montoTotal <= 0) {
      throw regla('SIN_VALORAR', 'Valora todos los ítems (precio mayor que cero) antes de enviarla.')
    }
    await enTransaccion(async (tx) => {
      // CA_81_02 · pasa a «pendiente» y registra la fecha de envío
      await consultar(`UPDATE cotizacion SET estado = 'pendiente', fecha_envio = now() WHERE id = $1`, [id], tx)
      // CA_81_03 · se notifica al cliente
      await notificarCliente(actual.cliente.id, {
        titulo: 'Tienes una cotización por revisar',
        mensaje: `RvR Tecnologías te envió la cotización ${actual.numero} por ${actual.montoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}.`,
        enlace: `/portal/cotizaciones/${id}`,
      }, tx)
    })
    res.json({
      ...(await detalleCotizacion(id)),
      notificado: actual.cliente.tieneCuenta,
    })
  }),
)

/** HU_40 · Registrar la aprobación o el rechazo (el cliente respondió por teléfono, WhatsApp o en persona) */
rutasCotizaciones.post(
  '/:id/decision',
  permiso('cotizaciones.registrar_decision'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = z
      .object({ decision: z.enum(['aprobada', 'rechazada']), motivo: textoOpcional(255) })
      .parse(req.body)
    res.json(await registrarDecision(id, d.decision, d.motivo, req.sesion!.usuarioId, 'administrador'))
  }),
)
