import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { CLAVES_MODULO, MODULOS } from '../auth/modulos.js'
import { filtroOpcional, idRuta, listaBase, normalizar, pagina, sinTildes, textoOpcional } from '../comun.js'
import { consultar, unaFila } from '../db.js'
import { asincrono, conflicto, noEncontrado, regla } from '../errores.js'

/** Configuración · Gestión de Permisos (HU_66 – HU_71). */
export const rutasPermisos = Router()
rutasPermisos.use(sesion)

interface FilaPermiso {
  id: number
  nombre: string
  modulo: string
  descripcion: string | null
  estado: string
  roles: number
  roles_activos: number
}

const BASE = `
  SELECT p.id, p.nombre, p.modulo, p.descripcion, p.estado,
         (SELECT count(*) FROM rol_x_permiso x WHERE x.permiso_id = p.id)::int AS roles,
         (SELECT count(*) FROM rol_x_permiso x JOIN rol r ON r.id = x.rol_id
           WHERE x.permiso_id = p.id AND r.estado = 'activo')::int AS roles_activos
    FROM permiso p
`

const nombreModulo = (clave: string) => MODULOS.find((m) => m.clave === clave)?.nombre ?? clave

const aPermiso = (f: FilaPermiso) => ({
  id: f.id,
  nombre: f.nombre,
  modulo: f.modulo,
  moduloNombre: nombreModulo(f.modulo),
  clave: `${f.modulo}.${f.nombre}`,
  descripcion: f.descripcion ?? '',
  estado: f.estado,
  roles: f.roles,
  rolesActivos: f.roles_activos,
})

/** CA_66_03 · Módulos definidos en el sistema. */
rutasPermisos.get(
  '/modulos',
  permiso('permisos.listar', 'permisos.buscar', 'permisos.registrar', 'permisos.editar', 'roles.registrar', 'roles.editar'),
  asincrono(async (_req, res) => {
    res.json(MODULOS)
  }),
)

/**
 * Catálogo agrupado por módulo para el formulario de roles (casillas).
 * CA_70_03 · los inactivos no se ofrecen (llegan marcados para mostrarlos
 * solo si el rol ya los tenía).
 */
rutasPermisos.get(
  '/catalogo',
  permiso('roles.registrar', 'roles.editar', 'roles.ver_detalle'),
  asincrono(async (_req, res) => {
    const filas = await consultar<FilaPermiso>(`${BASE} ORDER BY p.modulo, p.id`)
    const grupos = MODULOS.map((m) => ({
      modulo: m.clave,
      nombre: m.nombre,
      proceso: m.proceso,
      permisos: filas.filter((f) => f.modulo === m.clave).map(aPermiso),
    }))
    const conocidos = new Set<string>(CLAVES_MODULO)
    const otros = filas.filter((f) => !conocidos.has(f.modulo)).map(aPermiso)
    if (otros.length) grupos.push({ modulo: 'otros', nombre: 'Otros', proceso: 'Otros', permisos: otros })
    res.json(grupos.filter((g) => g.permisos.length > 0))
  }),
)

/** HU_68 listar · HU_67 buscar por nombre, módulo o estado */
rutasPermisos.get(
  '/',
  permiso('permisos.listar', 'permisos.buscar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .extend({
        estado: filtroOpcional(['activo', 'inactivo'] as const),
        modulo: z.enum(CLAVES_MODULO).optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaPermiso & { total: number }>(
      `WITH base AS (${BASE})
       SELECT *, count(*) OVER ()::int AS total FROM base
        WHERE ($1 = '' OR ${sinTildes(`nombre || ' ' || modulo || ' ' || coalesce(descripcion, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR estado = $2)
          AND ($3::text IS NULL OR modulo = $3)
        ORDER BY modulo, id
        LIMIT $4 OFFSET $5`,
      [normalizar(p.q), p.estado ?? null, p.modulo ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'activo')::int AS activo,
              count(*) FILTER (WHERE estado = 'inactivo')::int AS inactivo
         FROM permiso`,
    )
    res.json({ ...pagina(filas.map(aPermiso), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos })
  }),
)

async function detalle(id: number) {
  const fila = await unaFila<FilaPermiso>(`${BASE} WHERE p.id = $1`, [id])
  if (!fila) throw noEncontrado('ese permiso')
  // CA_71_02 · roles que lo tienen asignado
  const roles = await consultar(
    `SELECT r.id, r.nombre, r.estado,
            (SELECT count(*) FROM usuario u WHERE u.rol_id = r.id AND u.estado = 'activo')::int AS "usuariosActivos"
       FROM rol_x_permiso x JOIN rol r ON r.id = x.rol_id
      WHERE x.permiso_id = $1 ORDER BY r.nombre`,
    [id],
  )
  return { ...aPermiso(fila), listaRoles: roles }
}

/** HU_71 · Ver detalle */
rutasPermisos.get(
  '/:id',
  permiso('permisos.ver_detalle', 'permisos.editar'),
  asincrono(async (req, res) => {
    res.json(await detalle(idRuta.parse(req.params.id)))
  }),
)

const datosPermiso = z.object({
  // CA_66_04 · nombre y módulo obligatorios
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .toLowerCase()
    .min(1, 'El nombre es obligatorio')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Usa minúsculas, números y guion bajo (ej. ver_detalle)'),
  modulo: z.enum(CLAVES_MODULO, { error: 'Selecciona un módulo del sistema' }),
  descripcion: textoOpcional(255),
  confirmar: z.boolean().optional(),
})

async function duplicado(nombre: string, modulo: string, excepto = 0) {
  if (await unaFila(`SELECT 1 FROM permiso WHERE nombre = $1 AND modulo = $2 AND id <> $3`, [nombre, modulo, excepto])) {
    throw conflicto('PERMISO_DUPLICADO', 'Ya existe un permiso con ese nombre en ese módulo.')
  }
}

/** HU_66 · Registrar */
rutasPermisos.post(
  '/',
  permiso('permisos.registrar'),
  asincrono(async (req, res) => {
    const d = datosPermiso.parse(req.body)
    await duplicado(d.nombre, d.modulo)
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO permiso (nombre, modulo, descripcion, estado) VALUES ($1, $2, $3, 'activo') RETURNING id`,
      [d.nombre, d.modulo, d.descripcion],
    )
    res.status(201).json(await detalle(fila!.id))
  }),
)

/** HU_69 · Editar */
rutasPermisos.put(
  '/:id',
  permiso('permisos.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = datosPermiso.parse(req.body)
    const actual = await detalle(id)
    await duplicado(d.nombre, d.modulo, id)

    // CA_69_03 · si está en roles activos, se advierte antes de guardar
    const cambiaClave = actual.nombre !== d.nombre || actual.modulo !== d.modulo
    if (actual.rolesActivos > 0 && !d.confirmar) {
      throw conflicto('CONFIRMAR_CAMBIO',
        `Este permiso está asignado a ${actual.rolesActivos} rol(es) activo(s). ` +
          (cambiaClave
            ? 'Cambiar su nombre o módulo cambia lo que esos roles pueden hacer.'
            : 'El cambio se verá en esos roles.'),
        { roles: actual.listaRoles })
    }
    await consultar(`UPDATE permiso SET nombre = $2, modulo = $3, descripcion = $4 WHERE id = $1`, [
      id, d.nombre, d.modulo, d.descripcion,
    ])
    res.json(await detalle(id))
  }),
)

/** HU_70 · Cambiar estado (CA_70_04: los permisos no se eliminan) */
rutasPermisos.patch(
  '/:id/estado',
  permiso('permisos.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const { estado } = z.object({ estado: z.enum(['activo', 'inactivo']) }).parse(req.body)
    const actual = await detalle(id)
    // CA_70_02 · no se inactiva un permiso asociado a roles activos
    if (estado === 'inactivo' && actual.rolesActivos > 0) {
      throw regla('PERMISO_EN_USO',
        `No se puede inactivar: está asignado a ${actual.rolesActivos} rol(es) activo(s). Quítalo de esos roles primero.`,
        { roles: actual.listaRoles })
    }
    await consultar(`UPDATE permiso SET estado = $2 WHERE id = $1`, [id, estado])
    res.json(await detalle(id))
  }),
)
