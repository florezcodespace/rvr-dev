import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { idRuta, textoOpcional } from '../comun.js'
import { consultar, unaFila } from '../db.js'
import { asincrono, noEncontrado, regla } from '../errores.js'

/** Servicios · Gestión de Horarios Técnicos (HU_28 – HU_30). */
export const rutasDisponibilidad = Router()
rutasDisponibilidad.use(sesion)

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
const hora = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida')

interface FilaFranja {
  id: number
  tecnico_id: number
  tecnico: string
  especialidad: string | null
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  motivo: string | null
  visita_id: number | null
  orden_id: number | null
  codigo_orden: string | null
}

const SELECT = `
  SELECT d.id, d.tecnico_id, trim(t.nombres || ' ' || t.apellidos) AS tecnico, t.especialidad,
         d.fecha::text AS fecha, to_char(d.hora_inicio, 'HH24:MI') AS hora_inicio, to_char(d.hora_fin, 'HH24:MI') AS hora_fin,
         d.estado, d.motivo, a.id AS visita_id, a.orden_id, o.codigo_orden
    FROM disponibilidad d
    JOIN tecnico t ON t.id = d.tecnico_id
    LEFT JOIN agendamiento a ON a.disponibilidad_id = d.id AND a.estado = 'pendiente'
    LEFT JOIN orden o ON o.id = a.orden_id
`

const aFranja = (f: FilaFranja) => ({
  id: f.id,
  tecnicoId: f.tecnico_id,
  tecnico: f.tecnico,
  especialidad: f.especialidad ?? '',
  fecha: f.fecha,
  horaInicio: f.hora_inicio,
  horaFin: f.hora_fin,
  estado: f.estado,
  motivo: f.motivo ?? '',
  visita: f.visita_id ? { id: f.visita_id, ordenId: f.orden_id, codigoOrden: f.codigo_orden } : null,
})

/**
 * HU_29 · Consultar la disponibilidad por técnico y rango de fechas
 * (CA_29_01), con filtro por técnico, especialidad o fecha (CA_29_03).
 */
rutasDisponibilidad.get(
  '/',
  permiso('disponibilidad.consultar', 'agenda.agendar', 'agenda.reprogramar'),
  asincrono(async (req, res) => {
    const p = z
      .object({
        tecnico: z.coerce.number().int().positive().optional().catch(undefined),
        especialidad: z.string().trim().max(100).optional().catch(undefined),
        estado: z.enum(['disponible', 'ocupada', 'bloqueada']).optional().catch(undefined),
        desde: fecha.optional().catch(undefined),
        hasta: fecha.optional().catch(undefined),
      })
      .parse(req.query)
    const desde = p.desde ?? new Date().toISOString().slice(0, 10)
    const filas = await consultar<FilaFranja>(
      `${SELECT}
        WHERE d.fecha BETWEEN $1::date AND coalesce($2::date, $1::date + 6)
          AND ($3::int IS NULL OR d.tecnico_id = $3)
          AND ($4::text IS NULL OR t.especialidad = $4)
          AND ($5::text IS NULL OR d.estado = $5)
        ORDER BY d.fecha, d.hora_inicio, tecnico
        LIMIT 2000`,
      [desde, p.hasta ?? null, p.tecnico ?? null, p.especialidad || null, p.estado ?? null],
    )
    res.json(filas.map(aFranja))
  }),
)

/**
 * CA_51_02 · Franjas libres para agendar: técnicos activos con la franja en
 * «disponible» (CA_30_02: las ocupadas o bloqueadas no se ofrecen).
 */
rutasDisponibilidad.get(
  '/libres',
  permiso('agenda.agendar', 'agenda.reprogramar'),
  asincrono(async (req, res) => {
    const p = z
      .object({
        fecha: fecha.optional().catch(undefined),
        tecnico: z.coerce.number().int().positive().optional().catch(undefined),
        especialidad: z.string().trim().max(100).optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaFranja>(
      `${SELECT}
        WHERE d.estado = 'disponible' AND t.estado = 'activo'
          AND d.fecha = coalesce($1::date, current_date)
          AND (d.fecha + d.hora_inicio) > now()
          AND ($2::int IS NULL OR d.tecnico_id = $2)
          AND ($3::text IS NULL OR t.especialidad = $3)
          AND NOT EXISTS (SELECT 1 FROM agendamiento x
                           WHERE x.tecnico_id = d.tecnico_id AND x.estado = 'pendiente'
                             AND x.fecha_programada = d.fecha + d.hora_inicio)
        ORDER BY d.hora_inicio, tecnico`,
      [p.fecha ?? null, p.tecnico ?? null, p.especialidad || null],
    )
    res.json(filas.map(aFranja))
  }),
)

/** HU_28 · Registrar franja(s). Con `repetirHasta`, la misma franja en cada día hábil. */
rutasDisponibilidad.post(
  '/',
  permiso('disponibilidad.registrar'),
  asincrono(async (req, res) => {
    const d = z
      .object({
        tecnicoId: z.coerce.number({ error: 'Selecciona un técnico' }).int().positive('Selecciona un técnico'),
        fecha,
        horaInicio: hora,
        horaFin: hora,
        repetirHasta: fecha.optional().nullable(),
        incluirSabados: z.boolean().default(false),
      })
      .parse(req.body)

    // CA_28_02 · la hora de fin después de la de inicio
    if (d.horaFin <= d.horaInicio) throw regla('HORAS_INVALIDAS', 'La hora de fin debe ser posterior a la hora de inicio.')
    const tecnico = await unaFila<{ estado: string }>(`SELECT estado FROM tecnico WHERE id = $1`, [d.tecnicoId])
    if (!tecnico) throw noEncontrado('ese técnico')
    if (tecnico.estado !== 'activo') throw regla('TECNICO_INACTIVO', 'El técnico está inactivo.')

    const hasta = d.repetirHasta && d.repetirHasta > d.fecha ? d.repetirHasta : d.fecha
    const dias = await consultar<{ dia: string }>(
      `SELECT g::date::text AS dia FROM generate_series($1::date, $2::date, interval '1 day') g
        WHERE $1::date = $2::date OR extract(isodow FROM g) < CASE WHEN $3 THEN 7 ELSE 6 END`,
      [d.fecha, hasta, d.incluirSabados],
    )
    if (dias.length > 120) throw regla('RANGO_EXTENSO', 'Registra como máximo 120 días de una vez.')

    const creadas: number[] = []
    const cruzadas: string[] = []
    for (const { dia } of dias) {
      // CA_28_03 · sin cruces con otra franja del mismo técnico
      const cruce = await unaFila(
        `SELECT 1 FROM disponibilidad WHERE tecnico_id = $1 AND fecha = $2 AND $3::time < hora_fin AND hora_inicio < $4::time`,
        [d.tecnicoId, dia, d.horaInicio, d.horaFin],
      )
      if (cruce) { cruzadas.push(dia); continue }
      const fila = await unaFila<{ id: number }>(
        `INSERT INTO disponibilidad (tecnico_id, fecha, hora_inicio, hora_fin, estado)
         VALUES ($1, $2, $3, $4, 'disponible') RETURNING id`,
        [d.tecnicoId, dia, d.horaInicio, d.horaFin],
      )
      creadas.push(fila!.id)
    }

    if (creadas.length === 0) {
      throw regla('FRANJA_CRUZADA', 'La franja se cruza con otra del mismo técnico en esa fecha.', { cruzadas })
    }
    res.status(201).json({ creadas: creadas.length, cruzadas })
  }),
)

/** HU_30 · Cambiar el estado de una franja (disponible, ocupada o bloqueada). */
rutasDisponibilidad.patch(
  '/:id/estado',
  permiso('disponibilidad.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = z
      .object({ estado: z.enum(['disponible', 'ocupada', 'bloqueada']), motivo: textoOpcional(255) })
      .parse(req.body)
    const franja = await unaFila<FilaFranja>(`${SELECT} WHERE d.id = $1`, [id])
    if (!franja) throw noEncontrado('esa franja')
    // Una franja con visita pendiente se libera reprogramando o cancelando la visita.
    if (franja.visita_id && d.estado !== 'ocupada') {
      throw regla('FRANJA_CON_VISITA',
        `La franja tiene agendada la visita de la orden ${franja.codigo_orden}. Reprográmala o cancélala desde la agenda.`)
    }
    if (d.estado === 'bloqueada' && !d.motivo) throw regla('MOTIVO_REQUERIDO', 'Indica el motivo del bloqueo (permiso, incapacidad…).')
    await consultar(`UPDATE disponibilidad SET estado = $2, motivo = $3 WHERE id = $1`, [
      id, d.estado, d.estado === 'disponible' ? null : d.motivo,
    ])
    res.json(aFranja((await unaFila<FilaFranja>(`${SELECT} WHERE d.id = $1`, [id]))!))
  }),
)
