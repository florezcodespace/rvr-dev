import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { iso, rangoFechas } from '../comun.js'
import { consultar, unaFila } from '../db.js'
import { asincrono, regla } from '../errores.js'
import { ESTADOS_ORDEN } from './ordenes.js'

/**
 * Dashboard: Reportes Operacionales (HU_60 – HU_62), Indicadores de Gestión
 * (HU_63 – HU_64) y Estadísticas (HU_65).
 * CA_63_04 · todo se calcula por consulta sobre las tablas de operación, sin
 * tablas de resumen.
 */
export const rutasReportes = Router()
export const rutasIndicadores = Router()
export const rutasEstadisticas = Router()
rutasReportes.use(sesion)
rutasIndicadores.use(sesion)
rutasEstadisticas.use(sesion)

/** Rango por defecto: los últimos 30 días. */
function rango(q: unknown) {
  const r = rangoFechas.parse(q)
  const hoy = new Date()
  const dos = (n: number) => String(n).padStart(2, '0')
  const f = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
  const hasta = r.hasta ?? f(hoy)
  const desde = r.desde ?? f(new Date(hoy.getTime() - 29 * 86_400_000))
  if (desde > hasta) throw regla('RANGO_INVALIDO', 'La fecha inicial no puede ser posterior a la final.')
  return { desde, hasta }
}

// ================================================================= REPORTES

/** HU_60 · Reporte de órdenes de servicio por período, cliente, técnico o estado. */
rutasReportes.get(
  '/ordenes',
  permiso('reportes.ordenes'),
  asincrono(async (req, res) => {
    const { desde, hasta } = rango(req.query)
    const p = z
      .object({
        cliente: z.coerce.number().int().positive().optional().catch(undefined),
        tecnico: z.coerce.number().int().positive().optional().catch(undefined),
        estado: z.enum(ESTADOS_ORDEN).optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<{
      id: number; codigo_orden: string; cliente: string | null; servicios: string | null; tecnico: string | null
      fecha_creacion: Date; monto: number; abonado: number; saldo: number; estado: string; estado_pago: string | null
    }>(
      `SELECT o.id, o.codigo_orden, trim(c.nombres || ' ' || c.apellidos) AS cliente,
              (SELECT string_agg(coalesce(s.nombre, dc.descripcion) || CASE WHEN dc.cantidad > 1 THEN ' ×' || dc.cantidad ELSE '' END, ', ' ORDER BY dc.id)
                 FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
                 LEFT JOIN servicio s ON s.id = dc.servicio_id WHERE d.orden_id = o.id) AS servicios,
              (SELECT string_agg(DISTINCT trim(t.nombres || ' ' || t.apellidos), ', ')
                 FROM agendamiento a JOIN tecnico t ON t.id = a.tecnico_id
                WHERE a.orden_id = o.id AND a.estado IN ('pendiente', 'cumplida')) AS tecnico,
              o.fecha_creacion,
              coalesce(v.monto_total, (SELECT coalesce(sum(dc.subtotal), 0) FROM detalle_orden d
                 JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id WHERE d.orden_id = o.id)) AS monto,
              coalesce(v.abonado, 0) AS abonado, coalesce(v.saldo, 0) AS saldo, o.estado, v.estado_pago
         FROM orden o
         LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
         LEFT JOIN cliente c ON c.id = oc.cliente_id
         LEFT JOIN v_ventas v ON v.orden_id = o.id AND v.estado_pago <> 'anulada'
        WHERE o.fecha_creacion >= $1::date AND o.fecha_creacion < $2::date + 1
          AND ($3::int IS NULL OR oc.cliente_id = $3)
          AND ($4::int IS NULL OR EXISTS (SELECT 1 FROM agendamiento a WHERE a.orden_id = o.id AND a.tecnico_id = $4))
          AND ($5::text IS NULL OR o.estado = $5)
        ORDER BY o.fecha_creacion`,
      [desde, hasta, p.cliente ?? null, p.tecnico ?? null, p.estado ?? null],
    )
    const items = filas.map((f) => ({
      id: f.id,
      codigo: f.codigo_orden,
      cliente: f.cliente ?? '',
      servicios: f.servicios ?? '',
      tecnico: f.tecnico ?? 'Sin asignar',
      fecha: iso(f.fecha_creacion),
      monto: f.monto,
      abonado: f.abonado,
      saldo: f.estado === 'cancelada' ? 0 : f.saldo,
      estado: f.estado,
    }))
    // CA_60_03 · totales del período
    const porEstado = ESTADOS_ORDEN.map((e) => ({ estado: e, cantidad: items.filter((i) => i.estado === e).length }))
    const vigentes = items.filter((i) => i.estado !== 'cancelada')
    res.json({
      desde, hasta, generado: new Date().toISOString(),
      items,
      totales: {
        ordenes: items.length,
        monto: vigentes.reduce((s, i) => s + i.monto, 0),
        abonado: vigentes.reduce((s, i) => s + i.abonado, 0),
        saldo: vigentes.reduce((s, i) => s + i.saldo, 0),
        porEstado,
      },
    })
  }),
)

/** HU_61 · Reporte de servicios prestados por técnico. */
rutasReportes.get(
  '/tecnicos',
  permiso('reportes.tecnicos'),
  asincrono(async (req, res) => {
    const { desde, hasta } = rango(req.query)
    const { tecnico } = z.object({ tecnico: z.coerce.number().int().positive().optional().catch(undefined) }).parse(req.query)
    const filas = await consultar<{
      id: number; tecnico: string; especialidad: string | null; estado: string
      cumplidas: number; pendientes: number; canceladas: number; reprogramadas: number; ordenes: number
      servicios: number; minutos: number | null
    }>(
      `SELECT t.id, trim(t.nombres || ' ' || t.apellidos) AS tecnico, t.especialidad, t.estado,
              count(a.id) FILTER (WHERE a.estado = 'cumplida')::int     AS cumplidas,
              count(a.id) FILTER (WHERE a.estado = 'pendiente')::int    AS pendientes,
              count(a.id) FILTER (WHERE a.estado = 'cancelada')::int    AS canceladas,
              count(a.id) FILTER (WHERE a.estado = 'reprogramada')::int AS reprogramadas,
              count(DISTINCT a.orden_id) FILTER (WHERE a.estado = 'cumplida')::int AS ordenes,
              coalesce((SELECT sum(dc.cantidad) FROM detalle_orden d JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
                         WHERE dc.tipo_item = 'servicio' AND d.orden_id IN (
                           SELECT x.orden_id FROM agendamiento x WHERE x.tecnico_id = t.id AND x.estado = 'cumplida'
                              AND x.fecha_programada >= $1::date AND x.fecha_programada < $2::date + 1)), 0)::int AS servicios,
              round(avg(extract(epoch FROM (a.fecha_fin - a.fecha_inicio)) / 60) FILTER (WHERE a.estado = 'cumplida' AND a.fecha_inicio IS NOT NULL AND a.fecha_fin IS NOT NULL))::int AS minutos
         FROM tecnico t
         LEFT JOIN agendamiento a ON a.tecnico_id = t.id
               AND a.fecha_programada >= $1::date AND a.fecha_programada < $2::date + 1
        WHERE ($3::int IS NULL OR t.id = $3)
        GROUP BY t.id
        ORDER BY cumplidas DESC, tecnico`,
      [desde, hasta, tecnico ?? null],
    )
    const items = filas.map((f) => ({
      id: f.id,
      tecnico: f.tecnico,
      especialidad: f.especialidad ?? '',
      estado: f.estado,
      visitasCumplidas: f.cumplidas,
      visitasPendientes: f.pendientes,
      visitasCanceladas: f.canceladas,
      visitasReprogramadas: f.reprogramadas,
      ordenesAtendidas: f.ordenes,
      serviciosEjecutados: f.servicios,
      minutosPromedio: f.minutos,
    }))
    // CA_61_03 · totales por técnico y del período
    res.json({
      desde, hasta, generado: new Date().toISOString(),
      items,
      totales: {
        visitasCumplidas: items.reduce((s, i) => s + i.visitasCumplidas, 0),
        visitasPendientes: items.reduce((s, i) => s + i.visitasPendientes, 0),
        visitasCanceladas: items.reduce((s, i) => s + i.visitasCanceladas, 0),
        ordenesAtendidas: items.reduce((s, i) => s + i.ordenesAtendidas, 0),
        serviciosEjecutados: items.reduce((s, i) => s + i.serviciosEjecutados, 0),
      },
    })
  }),
)

// ============================================================== INDICADORES

/** Fecha de finalización de cada orden, sacada de su historial. */
const FINALIZACION = `
  (SELECT max(h.fecha) FROM historial_orden h WHERE h.orden_id = o.id AND h.estado_nuevo = 'finalizada')`

/** HU_63 · Servicios realizados y órdenes por estado. */
rutasIndicadores.get(
  '/servicios-ordenes',
  permiso('indicadores.servicios_ordenes'),
  asincrono(async (req, res) => {
    const { desde, hasta } = rango(req.query)
    const { estado } = z.object({ estado: z.enum(ESTADOS_ORDEN).optional().catch(undefined) }).parse(req.query)

    // CA_63_01 · servicios realizados en el período (ítems de servicio
    // completados en órdenes finalizadas dentro del rango)
    const realizados = await unaFila<{ servicios: number; ordenes: number }>(
      `SELECT coalesce(sum(dc.cantidad) FILTER (WHERE dc.tipo_item = 'servicio'), 0)::int AS servicios,
              count(DISTINCT o.id)::int AS ordenes
         FROM orden o
         JOIN detalle_orden d ON d.orden_id = o.id AND d.estado_item = 'completado'
         JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
        WHERE o.estado = 'finalizada'
          AND coalesce(${FINALIZACION}, o.fecha_creacion) >= $1::date
          AND coalesce(${FINALIZACION}, o.fecha_creacion) <  $2::date + 1`,
      [desde, hasta],
    )

    // CA_63_02 · órdenes agrupadas por estado con cantidad y porcentaje
    const porEstado = await consultar<{ estado: string; cantidad: number }>(
      `SELECT o.estado, count(*)::int AS cantidad FROM orden o
        WHERE o.fecha_creacion >= $1::date AND o.fecha_creacion < $2::date + 1
          AND ($3::text IS NULL OR o.estado = $3)
        GROUP BY o.estado`,
      [desde, hasta, estado ?? null],
    )
    const total = porEstado.reduce((s, e) => s + e.cantidad, 0)

    const serie = await consultar<{ semana: string; servicios: number }>(
      `SELECT to_char(date_trunc('week', coalesce(${FINALIZACION}, o.fecha_creacion)), 'YYYY-MM-DD') AS semana,
              coalesce(sum(dc.cantidad) FILTER (WHERE dc.tipo_item = 'servicio'), 0)::int AS servicios
         FROM orden o
         JOIN detalle_orden d ON d.orden_id = o.id AND d.estado_item = 'completado'
         JOIN detalle_cotizacion dc ON dc.id = d.detalle_cotizacion_id
        WHERE o.estado = 'finalizada'
          AND coalesce(${FINALIZACION}, o.fecha_creacion) >= $1::date
          AND coalesce(${FINALIZACION}, o.fecha_creacion) <  $2::date + 1
        GROUP BY 1 ORDER BY 1`,
      [desde, hasta],
    )

    res.json({
      desde, hasta,
      serviciosRealizados: realizados?.servicios ?? 0,
      ordenesFinalizadas: realizados?.ordenes ?? 0,
      totalOrdenes: total,
      ordenesPorEstado: ESTADOS_ORDEN.filter((e) => !estado || e === estado).map((e) => {
        const cantidad = porEstado.find((x) => x.estado === e)?.cantidad ?? 0
        return { estado: e, cantidad, porcentaje: total ? Math.round((cantidad / total) * 1000) / 10 : 0 }
      }),
      serieSemanal: serie,
    })
  }),
)

/** HU_64 · Servicios más solicitados y técnicos con más servicios ejecutados. */
rutasIndicadores.get(
  '/mas-solicitados',
  permiso('indicadores.mas_solicitados'),
  asincrono(async (req, res) => {
    const { desde, hasta } = rango(req.query)
    // CA_64_01 · ranking de los servicios más cotizados en el período
    const servicios = await consultar<{ id: number; nombre: string; categoria: string; unidades: number; cotizaciones: number; aprobadas: number }>(
      `SELECT s.id, s.nombre, s.categoria,
              sum(dc.cantidad)::int AS unidades,
              count(DISTINCT q.id)::int AS cotizaciones,
              count(DISTINCT q.id) FILTER (WHERE q.estado = 'aprobada')::int AS aprobadas
         FROM detalle_cotizacion dc
         JOIN servicio s   ON s.id = dc.servicio_id
         JOIN cotizacion q ON q.id = dc.cotizacion_id
        WHERE q.fecha_cotizacion >= $1::date AND q.fecha_cotizacion < $2::date + 1
        GROUP BY s.id ORDER BY unidades DESC, cotizaciones DESC LIMIT 10`,
      [desde, hasta],
    )
    // CA_64_02 · visitas cumplidas por técnico en el período
    const tecnicos = await consultar<{ id: number; nombre: string; especialidad: string | null; cumplidas: number }>(
      `SELECT t.id, trim(t.nombres || ' ' || t.apellidos) AS nombre, t.especialidad, count(a.id)::int AS cumplidas
         FROM tecnico t
         JOIN agendamiento a ON a.tecnico_id = t.id AND a.estado = 'cumplida'
              AND a.fecha_programada >= $1::date AND a.fecha_programada < $2::date + 1
        GROUP BY t.id ORDER BY cumplidas DESC, nombre`,
      [desde, hasta],
    )
    const categorias = await consultar<{ categoria: string; unidades: number }>(
      `SELECT s.categoria, sum(dc.cantidad)::int AS unidades
         FROM detalle_cotizacion dc JOIN servicio s ON s.id = dc.servicio_id JOIN cotizacion q ON q.id = dc.cotizacion_id
        WHERE q.fecha_cotizacion >= $1::date AND q.fecha_cotizacion < $2::date + 1
        GROUP BY s.categoria ORDER BY unidades DESC`,
      [desde, hasta],
    )
    res.json({
      desde, hasta,
      servicios,
      tecnicos: tecnicos.map((t) => ({ ...t, especialidad: t.especialidad ?? '' })),
      categorias,
    })
  }),
)

// ============================================================ ESTADÍSTICAS

/**
 * HU_65 · Estadísticas generales: total de órdenes, servicios más
 * solicitados, ingresos del período (CA_65_02: calculados con los abonos) y
 * tasa de aprobación de cotizaciones, con rango personalizable (CA_65_04).
 */
rutasEstadisticas.get(
  '/',
  permiso('estadisticas.consultar'),
  asincrono(async (req, res) => {
    const { desde, hasta } = rango(req.query)
    const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1
    const anteriorHasta = new Date(Date.parse(desde) - 86_400_000).toISOString().slice(0, 10)
    const anteriorDesde = new Date(Date.parse(desde) - dias * 86_400_000).toISOString().slice(0, 10)

    const periodo = async (d: string, h: string) =>
      (await unaFila<{ ordenes: number; ingresos: number; aprobadas: number; rechazadas: number; clientes: number; finalizadas: number }>(
        `SELECT
           (SELECT count(*) FROM orden WHERE fecha_creacion >= $1::date AND fecha_creacion < $2::date + 1)::int AS ordenes,
           (SELECT coalesce(sum(a.monto), 0) FROM abonos a JOIN ventas v ON v.id = a.venta_id
             WHERE v.estado_pago <> 'anulada' AND a.fecha_abono >= $1::date AND a.fecha_abono < $2::date + 1) AS ingresos,
           (SELECT count(*) FROM cotizacion WHERE estado = 'aprobada'
             AND fecha_respuesta >= $1::date AND fecha_respuesta < $2::date + 1)::int AS aprobadas,
           (SELECT count(*) FROM cotizacion WHERE estado = 'rechazada'
             AND fecha_respuesta >= $1::date AND fecha_respuesta < $2::date + 1)::int AS rechazadas,
           (SELECT count(*) FROM cliente WHERE fecha_registro >= $1::date AND fecha_registro < $2::date + 1)::int AS clientes,
           (SELECT count(*) FROM orden o WHERE o.estado = 'finalizada'
             AND coalesce(${FINALIZACION}, o.fecha_creacion) >= $1::date
             AND coalesce(${FINALIZACION}, o.fecha_creacion) < $2::date + 1)::int AS finalizadas`,
        [d, h],
      ))!

    const [actual, anterior] = await Promise.all([periodo(desde, hasta), periodo(anteriorDesde, anteriorHasta)])
    const tasa = (p: typeof actual) => (p.aprobadas + p.rechazadas ? Math.round((p.aprobadas / (p.aprobadas + p.rechazadas)) * 1000) / 10 : null)

    const porMes = dias > 62
    const serie = await consultar<{ fecha: string; ingresos: number; ordenes: number }>(
      `WITH periodos AS (
         SELECT generate_series(date_trunc($3, $1::date), date_trunc($3, $2::date), ('1 ' || $3)::interval)::date AS fecha)
       SELECT to_char(p.fecha, 'YYYY-MM-DD') AS fecha,
              coalesce((SELECT sum(a.monto) FROM abonos a JOIN ventas v ON v.id = a.venta_id
                         WHERE v.estado_pago <> 'anulada' AND date_trunc($3, a.fecha_abono)::date = p.fecha
                           AND a.fecha_abono >= $1::date AND a.fecha_abono < $2::date + 1), 0) AS ingresos,
              (SELECT count(*) FROM orden o WHERE date_trunc($3, o.fecha_creacion)::date = p.fecha
                  AND o.fecha_creacion >= $1::date AND o.fecha_creacion < $2::date + 1)::int AS ordenes
         FROM periodos p ORDER BY p.fecha`,
      [desde, hasta, porMes ? 'month' : 'day'],
    )

    const [porEstado, cotizaciones, servicios, cartera, metodos, proximas] = await Promise.all([
      consultar<{ estado: string; cantidad: number }>(
        `SELECT estado, count(*)::int AS cantidad FROM orden
          WHERE fecha_creacion >= $1::date AND fecha_creacion < $2::date + 1 GROUP BY estado`, [desde, hasta]),
      consultar<{ estado: string; cantidad: number }>(
        `SELECT estado, count(*)::int AS cantidad FROM cotizacion
          WHERE fecha_cotizacion >= $1::date AND fecha_cotizacion < $2::date + 1 GROUP BY estado`, [desde, hasta]),
      consultar<{ nombre: string; unidades: number }>(
        `SELECT s.nombre, sum(dc.cantidad)::int AS unidades
           FROM detalle_cotizacion dc JOIN servicio s ON s.id = dc.servicio_id JOIN cotizacion q ON q.id = dc.cotizacion_id
          WHERE q.fecha_cotizacion >= $1::date AND q.fecha_cotizacion < $2::date + 1
          GROUP BY s.nombre ORDER BY unidades DESC LIMIT 5`, [desde, hasta]),
      unaFila<{ saldo: number; ventas: number }>(
        `SELECT coalesce(sum(saldo), 0) AS saldo, count(*) FILTER (WHERE saldo > 0)::int AS ventas
           FROM v_ventas WHERE estado_pago <> 'anulada'`),
      consultar<{ metodo: string; total: number }>(
        `SELECT a.metodo_pago AS metodo, sum(a.monto) AS total FROM abonos a JOIN ventas v ON v.id = a.venta_id
          WHERE v.estado_pago <> 'anulada' AND a.fecha_abono >= $1::date AND a.fecha_abono < $2::date + 1
          GROUP BY 1 ORDER BY total DESC`, [desde, hasta]),
      consultar<{ id: number; orden_id: number; codigo_orden: string; tecnico: string; fecha_programada: Date; cliente: string | null }>(
        `SELECT a.id, a.orden_id, o.codigo_orden, trim(t.nombres || ' ' || t.apellidos) AS tecnico, a.fecha_programada,
                trim(c.nombres || ' ' || c.apellidos) AS cliente
           FROM agendamiento a JOIN orden o ON o.id = a.orden_id JOIN tecnico t ON t.id = a.tecnico_id
           LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id LEFT JOIN cliente c ON c.id = oc.cliente_id
          WHERE a.estado = 'pendiente' AND a.fecha_programada >= now() - interval '2 hours'
          ORDER BY a.fecha_programada LIMIT 6`),
    ])

    const pendientes = await unaFila<Record<string, number>>(
      `SELECT (SELECT count(*) FROM cotizacion WHERE estado = 'solicitada')::int AS por_valorar,
              (SELECT count(*) FROM cotizacion WHERE estado = 'pendiente')::int  AS esperando_cliente,
              (SELECT count(*) FROM orden WHERE estado = 'esperando_anticipo')::int AS esperando_anticipo,
              (SELECT count(*) FROM orden WHERE estado = 'en_espera_repuesto')::int AS en_espera_repuesto,
              (SELECT count(*) FROM orden o WHERE o.estado IN ('esperando_anticipo', 'en_proceso')
                  AND NOT EXISTS (SELECT 1 FROM agendamiento a WHERE a.orden_id = o.id AND a.estado = 'pendiente'))::int AS sin_visita`,
    )

    res.json({
      desde, hasta,
      anterior: { desde: anteriorDesde, hasta: anteriorHasta },
      totalOrdenes: actual.ordenes,
      totalOrdenesAnterior: anterior.ordenes,
      ordenesFinalizadas: actual.finalizadas,
      ingresos: actual.ingresos,
      ingresosAnterior: anterior.ingresos,
      tasaAprobacion: tasa(actual),
      tasaAprobacionAnterior: tasa(anterior),
      cotizacionesRespondidas: actual.aprobadas + actual.rechazadas,
      clientesNuevos: actual.clientes,
      cartera: cartera ?? { saldo: 0, ventas: 0 },
      agrupacion: porMes ? 'mes' : 'dia',
      serie,
      ordenesPorEstado: ESTADOS_ORDEN.map((e) => ({ estado: e, cantidad: porEstado.find((x) => x.estado === e)?.cantidad ?? 0 })),
      cotizacionesPorEstado: ['solicitada', 'pendiente', 'aprobada', 'rechazada'].map((e) => ({
        estado: e, cantidad: cotizaciones.find((x) => x.estado === e)?.cantidad ?? 0,
      })),
      serviciosMasSolicitados: servicios,
      ingresosPorMetodo: metodos,
      proximasVisitas: proximas.map((v) => ({
        id: v.id, ordenId: v.orden_id, codigo: v.codigo_orden, tecnico: v.tecnico, cliente: v.cliente ?? '', fecha: iso(v.fecha_programada),
      })),
      pendientes,
    })
  }),
)
