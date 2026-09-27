import { Router } from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { notificarCliente, notificarUsuario } from '../avisos.js'
import { idRuta, iso, textoOpcional } from '../comun.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, noEncontrado, regla } from '../errores.js'

/** Venta – Órdenes · Agendamiento (HU_51 – HU_54). */
export const rutasAgenda = Router()
rutasAgenda.use(sesion)

const ESTADOS_VISITA = ['pendiente', 'cumplida', 'reprogramada', 'cancelada'] as const

interface FilaVisita {
  id: number
  orden_id: number
  codigo_orden: string
  orden_estado: string
  tecnico_id: number
  tecnico: string
  fecha_programada: Date
  estado: string
  notas: string | null
  disponibilidad_id: number | null
  hora_fin: string | null
  fecha_inicio: Date | null
  fecha_fin: Date | null
  cliente: string | null
  direccion: string | null
  telefono: string | null
}

const SELECT = `
  SELECT a.id, a.orden_id, o.codigo_orden, o.estado AS orden_estado, a.tecnico_id,
         trim(t.nombres || ' ' || t.apellidos) AS tecnico, a.fecha_programada, a.estado, a.notas,
         a.disponibilidad_id, to_char(d.hora_fin, 'HH24:MI') AS hora_fin, a.fecha_inicio, a.fecha_fin,
         trim(c.nombres || ' ' || c.apellidos) AS cliente, coalesce(q.direccion, c.direccion) AS direccion, c.telefono
    FROM agendamiento a
    JOIN orden o   ON o.id = a.orden_id
    JOIN tecnico t ON t.id = a.tecnico_id
    LEFT JOIN disponibilidad d   ON d.id = a.disponibilidad_id
    LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
    LEFT JOIN cliente c          ON c.id = oc.cliente_id
    LEFT JOIN cotizacion q       ON q.id = oc.cotizacion_id
`

const aVisita = (f: FilaVisita) => ({
  id: f.id,
  orden: { id: f.orden_id, codigo: f.codigo_orden, estado: f.orden_estado },
  tecnico: { id: f.tecnico_id, nombre: f.tecnico },
  fechaProgramada: iso(f.fecha_programada),
  horaFin: f.hora_fin,
  estado: f.estado,
  notas: f.notas ?? '',
  enCurso: f.estado === 'pendiente' && f.fecha_inicio !== null && f.fecha_fin === null,
  inicio: iso(f.fecha_inicio),
  fin: iso(f.fecha_fin),
  cliente: f.cliente ?? '',
  direccion: f.direccion ?? '',
  telefono: f.telefono ?? '',
})

/** HU_52 · Calendario de visitas con filtro por técnico, fechas o estado (CA_52_02). */
rutasAgenda.get(
  '/',
  permiso('agenda.consultar'),
  asincrono(async (req, res) => {
    const p = z
      .object({
        desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
        hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
        tecnico: z.coerce.number().int().positive().optional().catch(undefined),
        estado: z.enum(ESTADOS_VISITA).optional().catch(undefined),
        orden: z.coerce.number().int().positive().optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaVisita>(
      `${SELECT}
        WHERE a.fecha_programada >= coalesce($1::date, date_trunc('month', now())::date)
          AND a.fecha_programada <  coalesce($2::date, (date_trunc('month', now()) + interval '1 month')::date) + 1
          AND ($3::int IS NULL OR a.tecnico_id = $3)
          AND ($4::text IS NULL OR a.estado = $4)
          AND ($5::int IS NULL OR a.orden_id = $5)
        ORDER BY a.fecha_programada, tecnico
        LIMIT 1500`,
      [p.desde ?? null, p.hasta ?? null, p.tecnico ?? null, p.estado ?? null, p.orden ?? null],
    )
    res.json(filas.map(aVisita))
  }),
)

/** Órdenes que se pueden agendar: las que no están cerradas. */
rutasAgenda.get(
  '/ordenes',
  permiso('agenda.agendar'),
  asincrono(async (_req, res) => {
    res.json(await consultar(
      `SELECT o.id, o.codigo_orden AS codigo, o.estado, trim(c.nombres || ' ' || c.apellidos) AS cliente,
              coalesce(q.direccion, c.direccion) AS direccion,
              (SELECT count(*) FROM agendamiento a WHERE a.orden_id = o.id AND a.estado = 'pendiente')::int AS "visitasPendientes"
         FROM orden o
         LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
         LEFT JOIN cliente c ON c.id = oc.cliente_id
         LEFT JOIN cotizacion q ON q.id = oc.cotizacion_id
        WHERE o.estado NOT IN ('finalizada', 'cancelada')
        ORDER BY o.fecha_creacion DESC`,
    ))
  }),
)

/** Reserva una franja libre para una visita (CA_51_02 – CA_51_04). */
async function reservarFranja(tx: pg.PoolClient, franjaId: number) {
  const f = await unaFila<{ id: number; tecnico_id: number; fecha: string; hora_inicio: string; estado: string; tecnico_estado: string; futura: boolean }>(
    `SELECT d.id, d.tecnico_id, d.fecha::text AS fecha, d.hora_inicio::text AS hora_inicio, d.estado, t.estado AS tecnico_estado,
            (d.fecha + d.hora_inicio) > now() AS futura
       FROM disponibilidad d JOIN tecnico t ON t.id = d.tecnico_id
      WHERE d.id = $1 FOR UPDATE OF d`,
    [franjaId], tx)
  if (!f) throw noEncontrado('esa franja de disponibilidad')
  if (f.tecnico_estado !== 'activo') throw regla('TECNICO_INACTIVO', 'El técnico está inactivo: no se le pueden agendar visitas.')
  if (f.estado !== 'disponible') throw regla('FRANJA_NO_DISPONIBLE', `Esa franja está ${f.estado}: elige otra.`)
  if (!f.futura) throw regla('FRANJA_PASADA', 'Esa franja ya pasó: elige una fecha y hora futuras.')
  // CA_51_03 · el técnico no puede tener otra visita a la misma hora
  const choque = await unaFila(
    `SELECT 1 FROM agendamiento WHERE tecnico_id = $1 AND estado = 'pendiente' AND fecha_programada = $2::date + $3::time`,
    [f.tecnico_id, f.fecha, f.hora_inicio], tx)
  if (choque) throw regla('TECNICO_OCUPADO', 'El técnico ya tiene otra visita agendada en esa fecha y hora.')
  // CA_51_04 / CA_30_03 · la franja pasa a «ocupada»
  await consultar(`UPDATE disponibilidad SET estado = 'ocupada', motivo = NULL WHERE id = $1`, [franjaId], tx)
  return f
}

async function liberarFranja(tx: pg.PoolClient, franjaId: number | null) {
  if (franjaId) await consultar(`UPDATE disponibilidad SET estado = 'disponible' WHERE id = $1 AND estado = 'ocupada'`, [franjaId], tx)
}

async function avisarVisita(tx: pg.PoolClient, visitaId: number, titulo: string) {
  const v = await unaFila<FilaVisita & { tecnico_usuario: number | null; cliente_id: number | null }>(
    `SELECT x.*, t.usuario_id AS tecnico_usuario, oc.cliente_id
       FROM (${SELECT} WHERE a.id = $1) x
       JOIN tecnico t ON t.id = x.tecnico_id
       LEFT JOIN v_orden_cliente oc ON oc.orden_id = x.orden_id`,
    [visitaId], tx)
  if (!v) return
  const cuando = new Date(v.fecha_programada).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short', hour12: true })
  await notificarUsuario(v.tecnico_usuario, { titulo, mensaje: `Orden ${v.codigo_orden} · ${v.cliente ?? ''} · ${cuando}`, enlace: `/movil/ordenes/${v.orden_id}` }, tx)
  if (v.cliente_id) {
    await notificarCliente(v.cliente_id, { titulo, mensaje: `Tu visita de la orden ${v.codigo_orden} es el ${cuando} con ${v.tecnico}.`, enlace: `/portal/ordenes/${v.orden_id}` }, tx)
  }
}

/** HU_51 · Agendar visita técnica (CA_51_05: una orden puede tener varias). */
rutasAgenda.post(
  '/',
  permiso('agenda.agendar'),
  asincrono(async (req, res) => {
    const d = z
      .object({
        ordenId: z.coerce.number({ error: 'Selecciona la orden' }).int().positive('Selecciona la orden'),
        disponibilidadId: z.coerce.number({ error: 'Selecciona la franja' }).int().positive('Selecciona la franja del técnico'),
        notas: textoOpcional(1000),
      })
      .parse(req.body)
    const id = await enTransaccion(async (tx) => {
      const orden = await unaFila<{ estado: string }>(`SELECT estado FROM orden WHERE id = $1`, [d.ordenId], tx)
      if (!orden) throw noEncontrado('esa orden')
      if (['finalizada', 'cancelada'].includes(orden.estado)) throw regla('ORDEN_CERRADA', 'La orden está cerrada: no se le pueden agendar visitas.')
      const f = await reservarFranja(tx, d.disponibilidadId)
      const visita = await unaFila<{ id: number }>(
        `INSERT INTO agendamiento (orden_id, tecnico_id, fecha_programada, estado, notas, disponibilidad_id)
         VALUES ($1, $2, $3::date + $4::time, 'pendiente', $5, $6) RETURNING id`,
        [d.ordenId, f.tecnico_id, f.fecha, f.hora_inicio, d.notas, f.id], tx)
      await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
        [d.ordenId, 'Visita técnica agendada', req.sesion!.usuarioId], tx)
      await avisarVisita(tx, visita!.id, 'Nueva visita agendada')
      return visita!.id
    })
    res.status(201).json(aVisita((await unaFila<FilaVisita>(`${SELECT} WHERE a.id = $1`, [id]))!))
  }),
)

/**
 * HU_53 · Reprogramar o reasignar: cambia fecha, técnico o ambos.
 * CA_53_02 valida disponibilidad · CA_53_03 libera la franja anterior y ocupa
 * la nueva · CA_53_04 conserva la visita anterior (queda «reprogramada»).
 */
rutasAgenda.post(
  '/:id/reprogramar',
  permiso('agenda.reprogramar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = z
      .object({
        disponibilidadId: z.coerce.number({ error: 'Selecciona la nueva franja' }).int().positive('Selecciona la nueva franja'),
        notas: textoOpcional(1000),
      })
      .parse(req.body)
    const nueva = await enTransaccion(async (tx) => {
      const v = await unaFila<FilaVisita>(`${SELECT} WHERE a.id = $1 FOR UPDATE OF a`, [id], tx)
      if (!v) throw noEncontrado('esa visita')
      if (v.estado !== 'pendiente') throw regla('VISITA_CERRADA', `Una visita ${v.estado} no se puede reprogramar.`)
      if (v.fecha_inicio) throw regla('VISITA_INICIADA', 'La visita ya fue iniciada por el técnico.')
      await consultar(
        `UPDATE agendamiento SET estado = 'reprogramada', notas = coalesce(notas || ' · ', '') || $2 WHERE id = $1`,
        [id, d.notas ? `Reprogramada: ${d.notas}` : 'Reprogramada'], tx)
      await liberarFranja(tx, v.disponibilidad_id)
      const f = await reservarFranja(tx, d.disponibilidadId)
      const fila = await unaFila<{ id: number }>(
        `INSERT INTO agendamiento (orden_id, tecnico_id, fecha_programada, estado, notas, disponibilidad_id)
         VALUES ($1, $2, $3::date + $4::time, 'pendiente', $5, $6) RETURNING id`,
        [v.orden_id, f.tecnico_id, f.fecha, f.hora_inicio, d.notas, f.id], tx)
      const cambio = f.tecnico_id !== v.tecnico_id ? 'Visita reasignada a otro técnico' : 'Visita reprogramada'
      await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
        [v.orden_id, cambio, req.sesion!.usuarioId], tx)
      await avisarVisita(tx, fila!.id, cambio)
      return fila!.id
    })
    res.json(aVisita((await unaFila<FilaVisita>(`${SELECT} WHERE a.id = $1`, [nueva]))!))
  }),
)

/** HU_54 · Cambiar estado de la visita (cumplida o cancelada) con notas (CA_54_03). */
rutasAgenda.patch(
  '/:id/estado',
  permiso('agenda.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = z
      .object({ estado: z.enum(['pendiente', 'cumplida', 'cancelada']), notas: textoOpcional(1000) })
      .parse(req.body)
    await enTransaccion(async (tx) => {
      const v = await unaFila<FilaVisita>(`${SELECT} WHERE a.id = $1 FOR UPDATE OF a`, [id], tx)
      if (!v) throw noEncontrado('esa visita')
      if (v.estado === 'reprogramada') throw regla('VISITA_REPROGRAMADA', 'Esa visita ya fue reprogramada: cambia la nueva.')
      if (v.estado === d.estado && !d.notas) return
      if (v.estado !== 'pendiente' && d.estado === 'pendiente') {
        throw regla('TRANSICION_INVALIDA', 'Una visita cerrada no vuelve a pendiente: agenda una nueva.')
      }
      await consultar(
        `UPDATE agendamiento SET estado = $2::varchar, notas = coalesce($3, notas),
                fecha_fin = CASE WHEN $2::varchar = 'cumplida' THEN coalesce(fecha_fin, now()) ELSE fecha_fin END
          WHERE id = $1`,
        [id, d.estado, d.notas], tx)
      // CA_54_02 · al cancelar se libera la franja del técnico
      if (d.estado === 'cancelada') await liberarFranja(tx, v.disponibilidad_id)
      if (d.estado !== v.estado) {
        await consultar(`INSERT INTO historial_orden (orden_id, descripcion, usuario_id) VALUES ($1, $2, $3)`,
          [v.orden_id, `Visita ${d.estado}${d.notas ? `: ${d.notas}` : ''}`.slice(0, 255), req.sesion!.usuarioId], tx)
        if (d.estado === 'cancelada') await avisarVisita(tx, id, 'Visita cancelada')
      }
    })
    res.json(aVisita((await unaFila<FilaVisita>(`${SELECT} WHERE a.id = $1`, [id]))!))
  }),
)

export { ESTADOS_VISITA }
