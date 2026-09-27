import { randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { MODULOS } from '../auth/modulos.js'
import {
  correoRequerido, filtroOpcional, idRuta, iso, listaBase, normalizar, pagina, sinTildes, telefono, textoRequerido,
} from '../comun.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, conflicto, noEncontrado, regla } from '../errores.js'

/** Usuarios · Gestión de Usuarios (HU_07 – HU_12). */
export const rutasUsuarios = Router()
rutasUsuarios.use(sesion)

/** Contraseña temporal legible: RvR-7K2M-Q9XT (sin 0/O ni 1/I). */
export function contrasenaTemporal(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bloque = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join('')
  return `RvR-${bloque()}-${bloque()}`
}

interface FilaUsuario {
  id: number
  nombre_usuario: string
  correo: string
  nombres: string
  apellidos: string
  telefono: string | null
  estado: string
  rol_id: number
  rol: string
  rol_estado: string
  cliente_id: number | null
  tecnico_id: number | null
  ultimo_acceso: Date | null
}

const BASE = `
  SELECT u.id, u.nombre_usuario, u.correo, u.nombres, u.apellidos, u.telefono, u.estado,
         r.id AS rol_id, r.nombre AS rol, r.estado AS rol_estado,
         c.id AS cliente_id, t.id AS tecnico_id,
         (SELECT max(fecha) FROM registro_acceso a WHERE a.usuario_id = u.id AND a.resultado = 'exitoso') AS ultimo_acceso
    FROM usuario u
    JOIN rol r          ON r.id = u.rol_id
    LEFT JOIN cliente c ON c.usuario_id = u.id
    LEFT JOIN tecnico t ON t.usuario_id = u.id
`

const aUsuario = (f: FilaUsuario) => ({
  id: f.id,
  nombreUsuario: f.nombre_usuario,
  nombres: f.nombres,
  apellidos: f.apellidos,
  nombre: `${f.nombres} ${f.apellidos}`.trim(),
  correo: f.correo,
  telefono: f.telefono ?? '',
  estado: f.estado,
  rol: { id: f.rol_id, nombre: f.rol, estado: f.rol_estado },
  vinculo: f.cliente_id ? { tipo: 'cliente', id: f.cliente_id } : f.tecnico_id ? { tipo: 'tecnico', id: f.tecnico_id } : null,
  ultimoAcceso: iso(f.ultimo_acceso),
})

/** HU_09 listar · HU_08 buscar por nombres, apellidos, correo, rol o estado */
rutasUsuarios.get(
  '/',
  permiso('usuarios.listar', 'usuarios.buscar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .extend({
        estado: filtroOpcional(['activo', 'inactivo'] as const),
        rol: z.coerce.number().int().positive().optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaUsuario & { total: number }>(
      `WITH base AS (${BASE})
       SELECT *, count(*) OVER ()::int AS total FROM base
        WHERE ($1 = '' OR ${sinTildes(`nombres || ' ' || apellidos || ' ' || correo || ' ' || nombre_usuario || ' ' || rol`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR estado = $2)
          AND ($3::int IS NULL OR rol_id = $3)
        ORDER BY estado, nombres, apellidos
        LIMIT $4 OFFSET $5`,
      [normalizar(p.q), p.estado ?? null, p.rol ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'activo')::int AS activo,
              count(*) FILTER (WHERE estado = 'inactivo')::int AS inactivo
         FROM usuario`,
    )
    res.json({ ...pagina(filas.map(aUsuario), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos })
  }),
)

async function detalle(id: number) {
  const fila = await unaFila<FilaUsuario>(`${BASE} WHERE u.id = $1`, [id])
  if (!fila) throw noEncontrado('ese usuario')
  // CA_12_02 · permisos que otorga el rol, por módulo
  const permisos = await consultar<{ id: number; nombre: string; modulo: string; descripcion: string | null }>(
    `SELECT p.id, p.nombre, p.modulo, p.descripcion
       FROM rol_x_permiso x JOIN permiso p ON p.id = x.permiso_id
      WHERE x.rol_id = $1 AND p.estado = 'activo'
      ORDER BY p.modulo, p.id`,
    [fila.rol_id],
  )
  const porModulo = MODULOS.map((m) => ({
    modulo: m.clave,
    nombre: m.nombre,
    permisos: permisos.filter((p) => p.modulo === m.clave).map((p) => ({ ...p, descripcion: p.descripcion ?? '' })),
  })).filter((g) => g.permisos.length > 0)
  const accesos = await consultar(
    `SELECT id, resultado, canal, ip, fecha FROM registro_acceso WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 10`,
    [id],
  )
  return { ...aUsuario(fila), permisosPorModulo: porModulo, ultimosAccesos: accesos.map((a) => ({ ...a, fecha: iso(a.fecha as Date) })) }
}

/** HU_12 · Ver detalle */
rutasUsuarios.get(
  '/:id',
  permiso('usuarios.ver_detalle', 'usuarios.editar'),
  asincrono(async (req, res) => {
    res.json(await detalle(idRuta.parse(req.params.id)))
  }),
)

const datosUsuario = z.object({
  nombreUsuario: z
    .string({ error: 'El nombre de usuario es obligatorio' })
    .trim()
    .toLowerCase()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50)
    .regex(/^[a-z0-9._-]+$/, 'Usa letras, números, punto, guion o guion bajo, sin espacios'),
  correo: correoRequerido,
  nombres: textoRequerido(100, 'Los nombres'),
  apellidos: textoRequerido(100, 'Los apellidos'),
  telefono,
  rolId: z.coerce.number({ error: 'Selecciona un rol' }).int().positive('Selecciona un rol'),
})

/** CA_07_02 / CA_10_02 · usuario y correo únicos */
async function validarUnicos(nombreUsuario: string, correo: string, excepto = 0) {
  if (await unaFila(`SELECT 1 FROM usuario WHERE lower(nombre_usuario) = lower($1) AND id <> $2`, [nombreUsuario, excepto])) {
    throw conflicto('USUARIO_DUPLICADO', 'Ese nombre de usuario ya está en uso.')
  }
  if (await unaFila(`SELECT 1 FROM usuario WHERE correo = $1 AND id <> $2`, [correo, excepto])) {
    throw conflicto('CORREO_EN_USO', 'Ese correo ya está en uso por otra cuenta.')
  }
}

/** CA_07_04 / CA_05_03 · el rol debe existir y estar activo */
async function validarRol(rolId: number, actual?: number) {
  const rol = await unaFila<{ estado: string }>(`SELECT estado FROM rol WHERE id = $1`, [rolId])
  if (!rol) throw regla('ROL_INEXISTENTE', 'El rol seleccionado no existe.')
  if (rol.estado !== 'activo' && rolId !== actual) throw regla('ROL_INACTIVO', 'El rol seleccionado está inactivo.')
}

/** HU_07 · Registrar usuario. La contraseña temporal se muestra una sola vez. */
rutasUsuarios.post(
  '/',
  permiso('usuarios.registrar'),
  asincrono(async (req, res) => {
    const d = datosUsuario.parse(req.body)
    await validarUnicos(d.nombreUsuario, d.correo)
    await validarRol(d.rolId)
    const temporal = contrasenaTemporal()
    // CA_07_03 · solo el hash queda en la base
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO usuario (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
      [d.rolId, d.nombreUsuario, d.correo, await bcrypt.hash(temporal, 10), d.nombres, d.apellidos, d.telefono],
    )
    res.status(201).json({ usuario: await detalle(fila!.id), contrasenaTemporal: temporal })
  }),
)

/** HU_10 · Editar */
rutasUsuarios.put(
  '/:id',
  permiso('usuarios.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = datosUsuario.parse(req.body)
    const actual = await detalle(id)
    await validarUnicos(d.nombreUsuario, d.correo, id)
    await validarRol(d.rolId, actual.rol.id)
    if (id === req.sesion!.usuarioId && d.rolId !== actual.rol.id) {
      throw regla('AUTOBLOQUEO', 'No puedes cambiar tu propio rol.')
    }
    await enTransaccion(async (tx) => {
      await consultar(
        `UPDATE usuario SET nombre_usuario = $2, correo = $3, nombres = $4, apellidos = $5, telefono = $6, rol_id = $7
          WHERE id = $1`,
        [id, d.nombreUsuario, d.correo, d.nombres, d.apellidos, d.telefono, d.rolId],
        tx,
      )
      // Una cuenta de cliente comparte el correo con su registro de cliente.
      if (actual.vinculo?.tipo === 'cliente') {
        await consultar(`UPDATE cliente SET correo = $2 WHERE usuario_id = $1`, [id, d.correo], tx)
      }
    })
    res.json(await detalle(id))
  }),
)

/** HU_11 · Cambiar estado (CA_11_03: los usuarios no se eliminan) */
rutasUsuarios.patch(
  '/:id/estado',
  permiso('usuarios.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const { estado } = z.object({ estado: z.enum(['activo', 'inactivo']) }).parse(req.body)
    const actual = await detalle(id)
    if (id === req.sesion!.usuarioId && estado === 'inactivo') {
      throw regla('AUTOBLOQUEO', 'No puedes inactivar tu propia cuenta.')
    }
    if (estado === 'activo' && actual.rol.estado !== 'activo') {
      throw regla('ROL_INACTIVO', 'El rol de esta cuenta está inactivo: asígnale un rol activo antes de activarla.')
    }
    // CA_11_02 · al inactivarla, sus sesiones abiertas dejan de valer
    await consultar(
      `UPDATE usuario SET estado = $2::varchar,
              version_sesion = version_sesion + CASE WHEN $2::varchar = 'inactivo' THEN 1 ELSE 0 END
        WHERE id = $1`,
      [id, estado],
    )
    res.json(await detalle(id))
  }),
)

/** Restablecer la contraseña de una cuenta desde administración (temporal, una vez). */
rutasUsuarios.post(
  '/:id/contrasena',
  permiso('usuarios.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    await detalle(id)
    const temporal = contrasenaTemporal()
    await consultar(
      `UPDATE usuario SET contrasena_hash = $2, version_sesion = version_sesion + 1,
              token_recuperacion = NULL, token_vence = NULL
        WHERE id = $1`,
      [id, await bcrypt.hash(temporal, 10)],
    )
    res.json({ contrasenaTemporal: temporal })
  }),
)
