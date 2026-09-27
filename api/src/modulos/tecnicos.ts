import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import {
  correoOpcional, documento, filtroOpcional, idRuta, iso, listaBase, normalizar, pagina, sinTildes, telefono,
  textoOpcional, textoRequerido,
} from '../comun.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, conflicto, noEncontrado, regla } from '../errores.js'
import { contrasenaTemporal } from './usuarios.js'

/**
 * Servicios · Gestión de Técnicos (HU_22 – HU_27).
 * El técnico trabaja desde la app móvil; aquí solo lo administra el personal.
 */
export const rutasTecnicos = Router()
rutasTecnicos.use(sesion)

interface FilaTecnico {
  id: number
  documento_identidad: string
  nombres: string
  apellidos: string
  especialidad: string | null
  telefono: string | null
  correo: string | null
  estado: string
  usuario_id: number | null
  usuario_estado: string | null
  visitas_pendientes: number
  visitas_cumplidas: number
}

const BASE = `
  SELECT t.*, u.estado AS usuario_estado,
         (SELECT count(*) FROM agendamiento a WHERE a.tecnico_id = t.id AND a.estado = 'pendiente')::int AS visitas_pendientes,
         (SELECT count(*) FROM agendamiento a WHERE a.tecnico_id = t.id AND a.estado = 'cumplida')::int  AS visitas_cumplidas
    FROM tecnico t
    LEFT JOIN usuario u ON u.id = t.usuario_id
`

const aTecnico = (f: FilaTecnico) => ({
  id: f.id,
  documento: f.documento_identidad,
  nombres: f.nombres,
  apellidos: f.apellidos,
  nombre: `${f.nombres} ${f.apellidos}`.trim(),
  especialidad: f.especialidad ?? '',
  telefono: f.telefono ?? '',
  correo: f.correo ?? '',
  estado: f.estado,
  cuentaMovil: f.usuario_id ? { usuarioId: f.usuario_id, estado: f.usuario_estado } : null,
  visitasPendientes: f.visitas_pendientes,
  visitasCumplidas: f.visitas_cumplidas,
})

/** Especialidades registradas, para el filtro (CA_24_02). */
rutasTecnicos.get(
  '/especialidades',
  permiso('tecnicos.listar', 'tecnicos.buscar', 'disponibilidad.consultar', 'agenda.agendar'),
  asincrono(async (_req, res) => {
    const filas = await consultar<{ especialidad: string }>(
      `SELECT DISTINCT especialidad FROM tecnico WHERE especialidad IS NOT NULL ORDER BY especialidad`,
    )
    res.json(filas.map((f) => f.especialidad))
  }),
)

/** Técnicos para selects (disponibilidad, agenda, reportes). */
rutasTecnicos.get(
  '/opciones',
  permiso('tecnicos.listar', 'disponibilidad.consultar', 'disponibilidad.registrar', 'agenda.consultar', 'agenda.agendar',
    'reportes.tecnicos', 'reportes.ordenes', 'ordenes.listar'),
  asincrono(async (_req, res) => {
    res.json(await consultar(
      `SELECT id, trim(nombres || ' ' || apellidos) AS nombre, especialidad, estado FROM tecnico ORDER BY estado, nombres`,
    ))
  }),
)

/** HU_24 listar · HU_23 buscar por nombres, apellidos, documento, especialidad o estado */
rutasTecnicos.get(
  '/',
  permiso('tecnicos.listar', 'tecnicos.buscar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .extend({
        estado: filtroOpcional(['activo', 'inactivo'] as const),
        especialidad: z.string().trim().max(100).optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaTecnico & { total: number }>(
      `WITH base AS (${BASE})
       SELECT *, count(*) OVER ()::int AS total FROM base
        WHERE ($1 = '' OR ${sinTildes(`nombres || ' ' || apellidos || ' ' || documento_identidad || ' ' || coalesce(especialidad, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR estado = $2)
          AND ($3::text IS NULL OR especialidad = $3)
        ORDER BY estado, nombres, apellidos
        LIMIT $4 OFFSET $5`,
      [normalizar(p.q), p.estado ?? null, p.especialidad || null, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'activo')::int AS activo,
              count(*) FILTER (WHERE estado = 'inactivo')::int AS inactivo
         FROM tecnico`,
    )
    res.json({ ...pagina(filas.map(aTecnico), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos })
  }),
)

async function detalle(id: number) {
  const fila = await unaFila<FilaTecnico>(`${BASE} WHERE t.id = $1`, [id])
  if (!fila) throw noEncontrado('ese técnico')
  // CA_27_02 · historial de agendamientos asignados
  const visitas = await consultar<{
    id: number; orden_id: number; codigo_orden: string; fecha_programada: Date; estado: string; notas: string | null
    cliente: string | null; fecha_inicio: Date | null; fecha_fin: Date | null
  }>(
    `SELECT a.id, a.orden_id, o.codigo_orden, a.fecha_programada, a.estado, a.notas, a.fecha_inicio, a.fecha_fin,
            trim(cl.nombres || ' ' || cl.apellidos) AS cliente
       FROM agendamiento a
       JOIN orden o ON o.id = a.orden_id
       LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id
       LEFT JOIN cliente cl ON cl.id = oc.cliente_id
      WHERE a.tecnico_id = $1
      ORDER BY a.fecha_programada DESC
      LIMIT 100`,
    [id],
  )
  const franjas = await unaFila<Record<string, number>>(
    `SELECT count(*) FILTER (WHERE estado = 'disponible')::int AS disponibles,
            count(*) FILTER (WHERE estado = 'ocupada')::int    AS ocupadas,
            count(*) FILTER (WHERE estado = 'bloqueada')::int  AS bloqueadas
       FROM disponibilidad WHERE tecnico_id = $1 AND fecha BETWEEN current_date AND current_date + 14`,
    [id],
  )
  return {
    ...aTecnico(fila),
    franjasProximas: franjas,
    visitas: visitas.map((v) => ({
      id: v.id,
      ordenId: v.orden_id,
      codigoOrden: v.codigo_orden,
      cliente: v.cliente ?? '',
      fechaProgramada: iso(v.fecha_programada),
      estado: v.estado,
      notas: v.notas ?? '',
      inicio: iso(v.fecha_inicio),
      fin: iso(v.fecha_fin),
    })),
  }
}

/** HU_27 · Ver detalle */
rutasTecnicos.get(
  '/:id',
  permiso('tecnicos.ver_detalle', 'tecnicos.editar'),
  asincrono(async (req, res) => {
    res.json(await detalle(idRuta.parse(req.params.id)))
  }),
)

const datosTecnico = z.object({
  documento,
  nombres: textoRequerido(100, 'Los nombres'),
  apellidos: textoRequerido(100, 'Los apellidos'),
  especialidad: textoOpcional(100),
  telefono,
  correo: correoOpcional,
})

async function documentoLibre(doc: string, excepto = 0) {
  if (await unaFila(`SELECT 1 FROM tecnico WHERE documento_identidad = $1 AND id <> $2`, [doc, excepto])) {
    throw conflicto('DOCUMENTO_DUPLICADO', 'Ya hay un técnico con ese documento de identidad.')
  }
}

/** Crea la cuenta de la app móvil del técnico (rol Técnico). */
async function crearCuentaMovil(tecnicoId: number) {
  const t = await unaFila<{ correo: string | null; nombres: string; apellidos: string; telefono: string | null; documento_identidad: string; usuario_id: number | null }>(
    `SELECT correo, nombres, apellidos, telefono, documento_identidad, usuario_id FROM tecnico WHERE id = $1`,
    [tecnicoId],
  )
  if (!t) throw noEncontrado('ese técnico')
  if (t.usuario_id) throw conflicto('CUENTA_EXISTE', 'El técnico ya tiene cuenta para la aplicación móvil.')
  if (!t.correo) throw regla('SIN_CORREO', 'Registra el correo del técnico para crearle la cuenta móvil.')
  if (await unaFila(`SELECT 1 FROM usuario WHERE correo = $1`, [t.correo])) {
    throw conflicto('CORREO_EN_USO', 'Ya hay una cuenta con el correo del técnico.')
  }
  const rol = await unaFila<{ id: number }>(`SELECT id FROM rol WHERE nombre = 'Técnico' AND estado = 'activo'`)
  if (!rol) throw regla('ROL_INEXISTENTE', 'No existe un rol «Técnico» activo para la aplicación móvil.')

  let nombreUsuario = (t.nombres[0]! + t.apellidos.split(' ')[0]!).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')
  if (await unaFila(`SELECT 1 FROM usuario WHERE nombre_usuario = $1`, [nombreUsuario])) nombreUsuario += t.documento_identidad.slice(-3)

  const temporal = contrasenaTemporal()
  await enTransaccion(async (tx) => {
    const u = await unaFila<{ id: number }>(
      `INSERT INTO usuario (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
      [rol.id, nombreUsuario, t.correo, await bcrypt.hash(temporal, 10), t.nombres, t.apellidos, t.telefono],
      tx,
    )
    await consultar(`UPDATE tecnico SET usuario_id = $2 WHERE id = $1`, [tecnicoId, u!.id], tx)
  })
  return { correo: t.correo, nombreUsuario, contrasenaTemporal: temporal }
}

/** HU_22 · Registrar técnico (y, si se pide, su cuenta para la app móvil) */
rutasTecnicos.post(
  '/',
  permiso('tecnicos.registrar'),
  asincrono(async (req, res) => {
    const d = datosTecnico.extend({ crearCuenta: z.boolean().default(false) }).parse(req.body)
    await documentoLibre(d.documento)
    if (d.crearCuenta && !d.correo) throw regla('SIN_CORREO', 'Para crear la cuenta móvil, registra el correo del técnico.')
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO tecnico (documento_identidad, nombres, apellidos, especialidad, telefono, correo, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'activo') RETURNING id`,
      [d.documento, d.nombres, d.apellidos, d.especialidad, d.telefono, d.correo],
    )
    const cuenta = d.crearCuenta ? await crearCuentaMovil(fila!.id) : null
    res.status(201).json({ tecnico: await detalle(fila!.id), cuenta })
  }),
)

/** Crear después la cuenta móvil de un técnico ya registrado. */
rutasTecnicos.post(
  '/:id/cuenta',
  permiso('tecnicos.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const cuenta = await crearCuentaMovil(id)
    res.status(201).json({ tecnico: await detalle(id), cuenta })
  }),
)

/** HU_25 · Editar */
rutasTecnicos.put(
  '/:id',
  permiso('tecnicos.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = datosTecnico.parse(req.body)
    const actual = await detalle(id)
    await documentoLibre(d.documento, id)
    await enTransaccion(async (tx) => {
      await consultar(
        `UPDATE tecnico SET documento_identidad = $2, nombres = $3, apellidos = $4, especialidad = $5,
                telefono = $6, correo = $7
          WHERE id = $1`,
        [id, d.documento, d.nombres, d.apellidos, d.especialidad, d.telefono, d.correo],
        tx,
      )
      // La cuenta móvil lleva el mismo nombre y teléfono.
      if (actual.cuentaMovil) {
        await consultar(`UPDATE usuario SET nombres = $2, apellidos = $3, telefono = $4 WHERE id = $1`,
          [actual.cuentaMovil.usuarioId, d.nombres, d.apellidos, d.telefono], tx)
      }
    })
    res.json(await detalle(id))
  }),
)

/** HU_26 · Cambiar estado (CA_26_04: no se eliminan) */
rutasTecnicos.patch(
  '/:id/estado',
  permiso('tecnicos.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const { estado, confirmar } = z
      .object({ estado: z.enum(['activo', 'inactivo']), confirmar: z.boolean().optional() })
      .parse(req.body)
    const actual = await detalle(id)
    // CA_26_03 · advertencia si tiene visitas pendientes
    if (estado === 'inactivo' && actual.visitasPendientes > 0 && !confirmar) {
      throw conflicto('CONFIRMAR_CAMBIO',
        `${actual.nombre} tiene ${actual.visitasPendientes} visita(s) pendiente(s). Al inactivarlo seguirán agendadas: reprográmalas o reasígnalas.`,
        { visitasPendientes: actual.visitasPendientes })
    }
    await consultar(`UPDATE tecnico SET estado = $2 WHERE id = $1`, [id, estado])
    res.json(await detalle(id))
  }),
)
