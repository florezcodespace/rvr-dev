import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { MODULOS } from '../auth/modulos.js'
import { filtroOpcional, idRuta, listaBase, normalizar, pagina, sinTildes, textoOpcional, textoRequerido } from '../comun.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, conflicto, noEncontrado, regla } from '../errores.js'

/** Configuración · Gestión de Roles (HU_01 – HU_06). */
export const rutasRoles = Router()
rutasRoles.use(sesion)

interface FilaRol {
  id: number
  nombre: string
  descripcion: string | null
  estado: string
  permisos: number
  usuarios: number
  usuarios_activos: number
}

const BASE = `
  SELECT r.id, r.nombre, r.descripcion, r.estado,
         (SELECT count(*) FROM rol_x_permiso x WHERE x.rol_id = r.id)::int                   AS permisos,
         (SELECT count(*) FROM usuario u WHERE u.rol_id = r.id)::int                         AS usuarios,
         (SELECT count(*) FROM usuario u WHERE u.rol_id = r.id AND u.estado = 'activo')::int AS usuarios_activos
    FROM rol r
`

const aRol = (f: FilaRol) => ({
  id: f.id,
  nombre: f.nombre,
  descripcion: f.descripcion ?? '',
  estado: f.estado,
  permisos: f.permisos,
  usuarios: f.usuarios,
  usuariosActivos: f.usuarios_activos,
})

/** HU_03 listar · HU_02 buscar por nombre o estado */
rutasRoles.get(
  '/',
  permiso('roles.listar', 'roles.buscar'),
  asincrono(async (req, res) => {
    const p = listaBase.extend({ estado: filtroOpcional(['activo', 'inactivo'] as const) }).parse(req.query)
    const filas = await consultar<FilaRol & { total: number }>(
      `WITH base AS (${BASE})
       SELECT *, count(*) OVER ()::int AS total FROM base
        WHERE ($1 = '' OR ${sinTildes(`nombre || ' ' || coalesce(descripcion, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR estado = $2)
        ORDER BY nombre
        LIMIT $3 OFFSET $4`,
      [normalizar(p.q), p.estado ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'activo')::int AS activo,
              count(*) FILTER (WHERE estado = 'inactivo')::int AS inactivo
         FROM rol`,
    )
    res.json({ ...pagina(filas.map(aRol), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos })
  }),
)

/** CA_05_03 · Solo los roles activos se ofrecen al crear o editar usuarios. */
rutasRoles.get(
  '/opciones',
  permiso('usuarios.registrar', 'usuarios.editar', 'usuarios.listar'),
  asincrono(async (_req, res) => {
    res.json(await consultar(`SELECT id, nombre, estado FROM rol ORDER BY nombre`))
  }),
)

async function detalle(id: number) {
  const rol = await unaFila<FilaRol>(`${BASE} WHERE r.id = $1`, [id])
  if (!rol) throw noEncontrado('ese rol')
  const permisos = await consultar<{ id: number; nombre: string; modulo: string; descripcion: string | null; estado: string }>(
    `SELECT p.id, p.nombre, p.modulo, p.descripcion, p.estado
       FROM rol_x_permiso x JOIN permiso p ON p.id = x.permiso_id
      WHERE x.rol_id = $1
      ORDER BY p.modulo, p.id`,
    [id],
  )
  // CA_06_02 · organizados por módulo, en el orden de los procesos
  const porModulo = MODULOS.map((m) => ({
    modulo: m.clave,
    nombre: m.nombre,
    proceso: m.proceso,
    permisos: permisos.filter((p) => p.modulo === m.clave).map((p) => ({ ...p, descripcion: p.descripcion ?? '' })),
  })).filter((g) => g.permisos.length > 0)
  const otros = permisos.filter((p) => !MODULOS.some((m) => m.clave === p.modulo))
  if (otros.length) porModulo.push({ modulo: 'otros', nombre: 'Otros', proceso: 'Otros', permisos: otros.map((p) => ({ ...p, descripcion: p.descripcion ?? '' })) })

  const usuarios = await consultar(
    `SELECT id, nombre_usuario AS "nombreUsuario", trim(nombres || ' ' || apellidos) AS nombre, correo, estado
       FROM usuario WHERE rol_id = $1 ORDER BY estado, nombres LIMIT 50`,
    [id],
  )
  return { ...aRol(rol), permisoIds: permisos.map((p) => p.id), porModulo, listaUsuarios: usuarios }
}

/** HU_06 · Ver detalle (solo lectura) */
rutasRoles.get(
  '/:id',
  permiso('roles.ver_detalle', 'roles.editar'),
  asincrono(async (req, res) => {
    res.json(await detalle(idRuta.parse(req.params.id)))
  }),
)

const datosRol = z.object({
  nombre: textoRequerido(50, 'El nombre del rol'),
  descripcion: textoOpcional(255),
  permisos: z.array(z.number().int().positive()).max(500),
})

/** CA_01_03 / CA_70_03 · Solo permisos existentes y activos (salvo los que ya tenía). */
async function validarPermisos(ids: number[], yaAsignados: number[] = []) {
  if (ids.length === 0) return
  const filas = await consultar<{ id: number; estado: string }>(
    `SELECT id, estado FROM permiso WHERE id = ANY($1::int[])`,
    [ids],
  )
  if (filas.length !== new Set(ids).size) throw regla('PERMISO_INEXISTENTE', 'Uno de los permisos seleccionados no existe.')
  const inactivos = filas.filter((f) => f.estado !== 'activo' && !yaAsignados.includes(f.id))
  if (inactivos.length) throw regla('PERMISO_INACTIVO', 'No se pueden asignar permisos inactivos.')
}

/** HU_01 · Registrar rol con sus permisos */
rutasRoles.post(
  '/',
  permiso('roles.registrar'),
  asincrono(async (req, res) => {
    const d = datosRol.parse(req.body)
    // CA_01_04 · al menos un permiso
    if (d.permisos.length === 0) throw regla('SIN_PERMISOS', 'Asigna al menos un permiso al rol.')
    await validarPermisos(d.permisos)
    // CA_01_02 · nombre único (sin distinguir mayúsculas)
    if (await unaFila(`SELECT 1 FROM rol WHERE lower(nombre) = lower($1)`, [d.nombre])) {
      throw conflicto('NOMBRE_DUPLICADO', 'Ya existe un rol con ese nombre.')
    }
    const id = await enTransaccion(async (tx) => {
      const rol = await unaFila<{ id: number }>(
        `INSERT INTO rol (nombre, descripcion, estado) VALUES ($1, $2, 'activo') RETURNING id`,
        [d.nombre, d.descripcion],
        tx,
      )
      await consultar(
        `INSERT INTO rol_x_permiso (rol_id, permiso_id) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING`,
        [rol!.id, d.permisos],
        tx,
      )
      return rol!.id
    })
    res.status(201).json(await detalle(id))
  }),
)

/** HU_04 · Editar rol y permisos */
rutasRoles.put(
  '/:id',
  permiso('roles.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = datosRol.parse(req.body)
    const actual = await detalle(id)

    // CA_04_02 · nombre único
    if (await unaFila(`SELECT 1 FROM rol WHERE lower(nombre) = lower($1) AND id <> $2`, [d.nombre, id])) {
      throw conflicto('NOMBRE_DUPLICADO', 'Ya existe un rol con ese nombre.')
    }
    // CA_04_03 · un rol con usuarios activos no puede quedar sin permisos
    if (d.permisos.length === 0 && actual.usuariosActivos > 0) {
      throw regla('ROL_SIN_PERMISOS', `El rol tiene ${actual.usuariosActivos} usuario(s) activo(s): no puede quedar sin permisos.`)
    }
    await validarPermisos(d.permisos, actual.permisoIds)

    // Protección: nadie se quita a sí mismo la gestión de roles por accidente.
    if (req.sesion!.rolId === id) {
      const claves = await consultar<{ clave: string }>(
        `SELECT modulo || '.' || nombre AS clave FROM permiso WHERE id = ANY($1::int[])`,
        [d.permisos],
      )
      if (!claves.some((c) => c.clave === 'roles.editar')) {
        throw regla('AUTOBLOQUEO', 'No puedes quitarle a tu propio rol el permiso de editar roles.')
      }
    }

    await enTransaccion(async (tx) => {
      await consultar(`UPDATE rol SET nombre = $2, descripcion = $3 WHERE id = $1`, [id, d.nombre, d.descripcion], tx)
      await consultar(`DELETE FROM rol_x_permiso WHERE rol_id = $1 AND NOT (permiso_id = ANY($2::int[]))`, [id, d.permisos], tx)
      await consultar(
        `INSERT INTO rol_x_permiso (rol_id, permiso_id) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING`,
        [id, d.permisos],
        tx,
      )
    })
    res.json(await detalle(id))
  }),
)

/** HU_05 · Cambiar estado */
rutasRoles.patch(
  '/:id/estado',
  permiso('roles.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const { estado } = z.object({ estado: z.enum(['activo', 'inactivo']) }).parse(req.body)
    const actual = await detalle(id)
    // CA_05_02 · no se inactiva un rol con usuarios activos
    if (estado === 'inactivo' && actual.usuariosActivos > 0) {
      throw regla('ROL_CON_USUARIOS',
        `No se puede inactivar: el rol tiene ${actual.usuariosActivos} usuario(s) activo(s). Reasígnalos o inactívalos primero.`,
        { usuariosActivos: actual.usuariosActivos })
    }
    await consultar(`UPDATE rol SET estado = $2 WHERE id = $1`, [id, estado])
    res.json(await detalle(id))
  }),
)
