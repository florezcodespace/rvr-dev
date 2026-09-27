import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { notificarCliente } from '../avisos.js'
import { filtroOpcional, idRuta, iso, listaBase, normalizar, pagina, rangoFechas, sinTildes, textoOpcional } from '../comun.js'
import { consultar, enTransaccion, motivo, unaFila } from '../db.js'
import { asincrono, noEncontrado, regla } from '../errores.js'

/** Venta – Órdenes · Gestión de Ventas (HU_55 – HU_57) y de Abonos (HU_58 – HU_59). */
export const rutasVentas = Router()
export const rutasAbonos = Router()
rutasVentas.use(sesion)
rutasAbonos.use(sesion)

const ESTADOS_PAGO = ['pendiente_anticipo', 'abonada', 'pagada', 'anulada'] as const
export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Tarjeta'] as const

interface FilaVenta {
  id: number
  orden_id: number
  codigo_orden: string
  orden_estado: string
  cliente_id: number | null
  cliente: string | null
  monto_total: number
  monto_anticipo: number
  abonado: number
  saldo: number
  estado_pago: string
  fecha_venta: Date
}

const SELECT_VENTA = `
  SELECT v.id, v.orden_id, o.codigo_orden, o.estado AS orden_estado, v.cliente_id,
         trim(c.nombres || ' ' || c.apellidos) AS cliente,
         v.monto_total, v.monto_anticipo, v.abonado, v.saldo, v.estado_pago, v.fecha_venta
    FROM v_ventas v
    JOIN orden o ON o.id = v.orden_id
    LEFT JOIN cliente c ON c.id = v.cliente_id
`

const aVenta = (f: FilaVenta) => ({
  id: f.id,
  orden: { id: f.orden_id, codigo: f.codigo_orden, estado: f.orden_estado },
  cliente: f.cliente_id ? { id: f.cliente_id, nombre: f.cliente } : null,
  montoTotal: f.monto_total,
  montoAnticipo: f.monto_anticipo,
  abonado: f.abonado,
  // CA_56_02 · el saldo se calcula con los abonos cada vez que se consulta
  saldo: f.estado_pago === 'anulada' ? 0 : f.saldo,
  anticipoCubierto: f.abonado >= f.monto_anticipo,
  estadoPago: f.estado_pago,
  fecha: iso(f.fecha_venta),
})

async function detalleVenta(id: number) {
  const f = await unaFila<FilaVenta>(`${SELECT_VENTA} WHERE v.id = $1`, [id])
  if (!f) throw noEncontrado('esa venta')
  // CA_56_03 · historial de abonos con fecha, monto, tipo y método
  const abonos = await consultar<{ id: number; monto: number; tipo_abono: string; metodo_pago: string; referencia: string | null; fecha_abono: Date }>(
    `SELECT id, monto, tipo_abono, metodo_pago, referencia, fecha_abono FROM abonos WHERE venta_id = $1 ORDER BY fecha_abono, id`,
    [id],
  )
  return {
    ...aVenta(f),
    abonos: abonos.map((a) => ({ id: a.id, monto: a.monto, tipo: a.tipo_abono, metodo: a.metodo_pago, referencia: a.referencia ?? '', fecha: iso(a.fecha_abono) })),
  }
}

/** HU_56 · Estado de pago de las ventas (listado con filtro y búsqueda). */
rutasVentas.get(
  '/',
  permiso('ventas.consultar_estado'),
  asincrono(async (req, res) => {
    const p = listaBase.merge(rangoFechas).extend({ estado: filtroOpcional(ESTADOS_PAGO) }).parse(req.query)
    const filas = await consultar<FilaVenta & { total: number }>(
      `WITH base AS (${SELECT_VENTA})
       SELECT *, count(*) OVER ()::int AS total FROM base
        WHERE ($1 = '' OR ${sinTildes(`codigo_orden || ' ' || coalesce(cliente, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR estado_pago = $2)
          AND ($3::date IS NULL OR fecha_venta >= $3::date)
          AND ($4::date IS NULL OR fecha_venta < $4::date + 1)
        ORDER BY (estado_pago IN ('pendiente_anticipo', 'abonada')) DESC, fecha_venta DESC
        LIMIT $5 OFFSET $6`,
      [normalizar(p.q), p.estado ?? null, p.desde ?? null, p.hasta ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const resumen = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado_pago = 'pendiente_anticipo')::int AS pendiente_anticipo,
              count(*) FILTER (WHERE estado_pago = 'abonada')::int AS abonada,
              count(*) FILTER (WHERE estado_pago = 'pagada')::int  AS pagada,
              count(*) FILTER (WHERE estado_pago = 'anulada')::int AS anulada,
              coalesce(sum(saldo) FILTER (WHERE estado_pago <> 'anulada'), 0) AS cartera
         FROM v_ventas`,
    )
    res.json({ ...pagina(filas.map(aVenta), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos: resumen })
  }),
)

/** Órdenes que aún no tienen venta (para registrarla). */
rutasVentas.get(
  '/ordenes-sin-venta',
  permiso('ventas.registrar'),
  asincrono(async (_req, res) => {
    const filas = await consultar<{ id: number; codigo: string; cliente: string | null; total: number }>(
      `SELECT o.id, o.codigo_orden AS codigo, trim(c.nombres || ' ' || c.apellidos) AS cliente,
              (SELECT coalesce(sum(dc.subtotal), 0) FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
                WHERE d.orden_id = o.id) AS total
         FROM orden o
         LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
         LEFT JOIN cliente c ON c.id = oc.cliente_id
        WHERE o.estado <> 'cancelada' AND NOT EXISTS (SELECT 1 FROM ventas v WHERE v.orden_id = o.id)
        ORDER BY o.fecha_creacion DESC`,
    )
    res.json(filas)
  }),
)

/** Estado de pago de una orden concreta (lo usa el detalle de la orden). */
rutasVentas.get(
  '/orden/:ordenId',
  permiso('ventas.consultar_estado'),
  asincrono(async (req, res) => {
    const ordenId = idRuta.parse(req.params.ordenId)
    const v = await unaFila<{ id: number }>(`SELECT id FROM ventas WHERE orden_id = $1`, [ordenId])
    if (!v) throw noEncontrado('una venta para esa orden')
    res.json(await detalleVenta(v.id))
  }),
)

/** HU_56 · Consultar estado de pago */
rutasVentas.get(
  '/:id',
  permiso('ventas.consultar_estado'),
  asincrono(async (req, res) => {
    res.json(await detalleVenta(idRuta.parse(req.params.id)))
  }),
)

/**
 * HU_55 · Registrar la venta de una orden.
 * CA_55_01 total = cotizaciones aprobadas de la orden · CA_55_02 una por
 * orden · CA_55_03 anticipo del 50 %, ajustable · CA_55_04 «pendiente de anticipo».
 */
rutasVentas.post(
  '/',
  permiso('ventas.registrar'),
  asincrono(async (req, res) => {
    const d = z
      .object({
        ordenId: z.coerce.number({ error: 'Selecciona la orden' }).int().positive('Selecciona la orden'),
        montoAnticipo: z.coerce.number().min(0, 'El anticipo no puede ser negativo').optional().nullable(),
      })
      .parse(req.body)
    const id = await enTransaccion(async (tx) => {
      const orden = await unaFila<{ estado: string }>(`SELECT estado FROM orden WHERE id = $1`, [d.ordenId], tx)
      if (!orden) throw noEncontrado('esa orden')
      if (orden.estado === 'cancelada') throw regla('ORDEN_CANCELADA', 'La orden está cancelada.')
      if (await unaFila(`SELECT 1 FROM ventas WHERE orden_id = $1`, [d.ordenId], tx)) {
        throw regla('ORDEN_CON_VENTA', 'Esa orden ya tiene una venta registrada: cada orden tiene una sola venta.')
      }
      const total = (await unaFila<{ total: number }>(
        `SELECT coalesce(sum(dc.subtotal), 0) AS total
           FROM detalle_orden d
           JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
           JOIN cotizacion q ON q.id = dc.cotizacion_id AND q.estado = 'aprobada'
          WHERE d.orden_id = $1`,
        [d.ordenId], tx))!.total
      if (total <= 0) throw regla('SIN_MONTO', 'La orden no tiene valor aprobado para registrar la venta.')
      const anticipo = d.montoAnticipo ?? Math.round(total * 0.5)
      if (anticipo > total) throw regla('ANTICIPO_INVALIDO', 'El anticipo no puede superar el monto total.')
      const fila = await unaFila<{ id: number }>(
        `INSERT INTO ventas (orden_id, monto_total, monto_anticipo, saldo_pendiente, estado_pago)
         VALUES ($1, $2, $3, $2, 'pendiente_anticipo') RETURNING id`,
        [d.ordenId, total, anticipo], tx)
      await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
        [d.ordenId, 'Venta registrada: pendiente de anticipo', req.sesion!.usuarioId], tx)
      return fila!.id
    })
    res.status(201).json(await detalleVenta(id))
  }),
)

/**
 * HU_57 · Cambiar el estado de pago. Anticipo, abonada y pagada los pone la
 * base al registrar cada abono (CA_57_01, CA_57_02); aquí se anula la venta
 * (CA_57_03) o se recalcula su estado.
 */
rutasVentas.patch(
  '/:id/estado',
  permiso('ventas.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = z.object({ estado: z.enum(['anulada', 'recalcular']), motivo: textoOpcional(200) }).parse(req.body)
    await enTransaccion(async (tx) => {
      const v = await unaFila<{ estado_pago: string; orden_id: number }>(`SELECT estado_pago, orden_id FROM ventas WHERE id = $1 FOR UPDATE`, [id], tx)
      if (!v) throw noEncontrado('esa venta')
      if (v.estado_pago === 'anulada') throw regla('VENTA_ANULADA', 'La venta ya está anulada.')
      if (d.estado === 'anulada') {
        await consultar(`UPDATE ventas SET estado_pago = 'anulada', saldo_pendiente = 0 WHERE id = $1`, [id], tx)
        await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
          [v.orden_id, `Venta anulada${d.motivo ? `: ${d.motivo}` : ''}`.slice(0, 255), req.sesion!.usuarioId], tx)
      } else {
        await consultar(
          `UPDATE ventas v SET
             saldo_pendiente = v.monto_total - x.abonado,
             estado_pago = CASE WHEN v.monto_total - x.abonado = 0 THEN 'pagada'
                                WHEN x.abonado >= v.monto_anticipo AND x.abonado > 0 THEN 'abonada'
                                ELSE 'pendiente_anticipo' END
             FROM (SELECT coalesce(sum(monto), 0) AS abonado FROM abonos WHERE venta_id = $1) x
            WHERE v.id = $1`,
          [id], tx)
      }
    })
    res.json(await detalleVenta(id))
  }),
)

// ================================================================= ABONOS

/** HU_59 · Listar abonos con filtro por tipo, método o fechas y total filtrado (CA_59_03). */
rutasAbonos.get(
  '/',
  permiso('abonos.listar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .merge(rangoFechas)
      .extend({
        tipo: filtroOpcional(['anticipo', 'saldo'] as const),
        metodo: z.enum(METODOS_PAGO).optional().catch(undefined),
      })
      .parse(req.query)
    const where = `
      WHERE ($1 = '' OR ${sinTildes(`o.codigo_orden || ' ' || coalesce(c.nombres || ' ' || c.apellidos, '') || ' ' || coalesce(a.referencia, '')`)} LIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR a.tipo_abono = $2)
        AND ($3::text IS NULL OR a.metodo_pago = $3)
        AND ($4::date IS NULL OR a.fecha_abono >= $4::date)
        AND ($5::date IS NULL OR a.fecha_abono < $5::date + 1)`
    const desde = `
      FROM abonos a
      JOIN ventas v ON v.id = a.venta_id
      JOIN orden o  ON o.id = v.orden_id
      LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
      LEFT JOIN cliente c ON c.id = oc.cliente_id`
    const valores = [normalizar(p.q), p.tipo ?? null, p.metodo ?? null, p.desde ?? null, p.hasta ?? null]
    const filas = await consultar<{
      id: number; venta_id: number; orden_id: number; codigo_orden: string; cliente: string | null; monto: number
      tipo_abono: string; metodo_pago: string; referencia: string | null; fecha_abono: Date; estado_pago: string; total: number
    }>(
      `SELECT a.id, a.venta_id, o.id AS orden_id, o.codigo_orden, trim(c.nombres || ' ' || c.apellidos) AS cliente,
              a.monto, a.tipo_abono, a.metodo_pago, a.referencia, a.fecha_abono, v.estado_pago,
              count(*) OVER ()::int AS total
         ${desde} ${where}
        ORDER BY a.fecha_abono DESC, a.id DESC
        LIMIT $6 OFFSET $7`,
      [...valores, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const totales = await unaFila<{ total_abonado: number; cantidad: number }>(
      `SELECT coalesce(sum(a.monto), 0) AS total_abonado, count(*)::int AS cantidad ${desde} ${where}`,
      valores,
    )
    res.json({
      ...pagina(
        filas.map((f) => ({
          id: f.id,
          ventaId: f.venta_id,
          orden: { id: f.orden_id, codigo: f.codigo_orden },
          cliente: f.cliente ?? '',
          monto: f.monto,
          tipo: f.tipo_abono,
          metodo: f.metodo_pago,
          referencia: f.referencia ?? '',
          fecha: iso(f.fecha_abono),
          ventaAnulada: f.estado_pago === 'anulada',
        })),
        filas[0]?.total ?? 0,
        p.pagina,
        p.porPagina,
      ),
      totalFiltrado: totales?.total_abonado ?? 0,
      metodos: METODOS_PAGO,
    })
  }),
)

/** Ventas que reciben abonos (con saldo y no anuladas). */
rutasAbonos.get(
  '/ventas-con-saldo',
  permiso('abonos.registrar'),
  asincrono(async (_req, res) => {
    const filas = await consultar<FilaVenta>(
      `${SELECT_VENTA} WHERE v.estado_pago <> 'anulada' AND v.saldo > 0 ORDER BY v.fecha_venta DESC`,
    )
    res.json(filas.map(aVenta))
  }),
)

/**
 * HU_58 · Registrar abono.
 * CA_58_02 mayor que cero y sin superar el saldo · CA_58_03 fecha automática ·
 * CA_58_04 recalcula saldo y estado de pago (trigger fn_abono_venta).
 * Con el anticipo cubierto, la orden que lo esperaba pasa a «en proceso».
 */
rutasAbonos.post(
  '/',
  permiso('abonos.registrar'),
  asincrono(async (req, res) => {
    const d = z
      .object({
        ventaId: z.coerce.number({ error: 'Selecciona la venta' }).int().positive('Selecciona la venta'),
        monto: z.coerce.number({ error: 'El monto debe ser un número' }).positive('El monto debe ser mayor que cero'),
        tipoAbono: z.enum(['anticipo', 'saldo'], { error: 'Selecciona el tipo de abono' }),
        metodoPago: z.enum(METODOS_PAGO, { error: 'Selecciona el método de pago' }),
        referencia: textoOpcional(100),
      })
      .parse(req.body)
    const resultado = await enTransaccion(async (tx) => {
      const v = await unaFila<{ saldo: number; estado_pago: string; orden_id: number; cliente_id: number | null; codigo_orden: string }>(
        `SELECT v.saldo, v.estado_pago, v.orden_id, v.cliente_id, o.codigo_orden
           FROM v_ventas v JOIN orden o ON o.id = v.orden_id WHERE v.id = $1`, [d.ventaId], tx)
      if (!v) throw noEncontrado('esa venta')
      if (v.estado_pago === 'anulada') throw regla('VENTA_ANULADA', 'La venta está anulada: no recibe abonos.')
      if (d.monto > v.saldo) {
        throw regla('ABONO_SUPERA_SALDO', `El abono supera el saldo pendiente (${v.saldo.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}).`)
      }
      const abono = await unaFila<{ id: number }>(
        `INSERT INTO abonos (venta_id, monto, tipo_abono, metodo_pago, referencia) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [d.ventaId, d.monto, d.tipoAbono, d.metodoPago, d.referencia], tx)
      await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
        [v.orden_id, `Abono de ${d.tipoAbono} registrado (${d.metodoPago})`, req.sesion!.usuarioId], tx)

      const venta = await unaFila<{ estado_pago: string }>(`SELECT estado_pago FROM ventas WHERE id = $1`, [d.ventaId], tx)
      const orden = await unaFila<{ estado: string }>(`SELECT estado FROM orden WHERE id = $1`, [v.orden_id], tx)
      let ordenEnProceso = false
      if (orden?.estado === 'esperando_anticipo' && venta && ['abonada', 'pagada'].includes(venta.estado_pago)) {
        await motivo(tx, 'Anticipo recibido: la orden pasa a ejecución')
        await consultar(`UPDATE orden SET estado = 'en_proceso' WHERE id = $1`, [v.orden_id], tx)
        ordenEnProceso = true
      }
      if (v.cliente_id) {
        await notificarCliente(v.cliente_id, {
          titulo: 'Pago registrado',
          mensaje: `Recibimos tu pago de ${d.monto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} para la orden ${v.codigo_orden}.`,
          enlace: `/portal/ordenes/${v.orden_id}`,
        }, tx)
      }
      return { abonoId: abono!.id, ordenEnProceso }
    }, { usuarioId: req.sesion!.usuarioId })
    res.status(201).json({ ...resultado, venta: await detalleVenta(d.ventaId) })
  }),
)
