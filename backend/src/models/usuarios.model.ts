import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { consultar, enTransaccion, unaFila } from '../db.js'
import {
  correoRequerido, documento, errorDocumento, filtroOpcional, iso, listaBase, normalizar, pagina, sinTildes, telefono,
  textoOpcional, textoRequerido, tipoDocumento,
} from '../utils/comun.js'
import { contrasenaTemporal } from '../utils/cuentas.js'
import { conflicto, noEncontrado, regla } from '../utils/errores.js'
import { MODULOS } from '../utils/modulos.js'

/** Usuarios · Gestión de Usuarios (HU_07 – HU_12). */

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

export const filtroDisponible = z.object({
  campo: z.enum(['nombreUsuario', 'correo']),
  valor: z.string().trim().toLowerCase().max(100),
  excepto: z.coerce.number().int().nonnegative().catch(0),
})

/** [Feedback 5] ¿Nombre de usuario o correo libres? Lo usa el formulario al salir del campo. */
export async function disponible(q: z.infer<typeof filtroDisponible>) {
  const columna = q.campo === 'correo' ? 'correo' : 'lower(nombre_usuario)'
  const fila = await unaFila(`SELECT 1 FROM usuario WHERE ${columna} = $1 AND id <> $2`, [q.valor, q.excepto])
  return { disponible: !fila }
}

export const filtroUsuarios = listaBase.extend({
  estado: filtroOpcional(['activo', 'inactivo'] as const),
  rol: z.coerce.number().int().positive().optional().catch(undefined),
})

/** HU_09 listar · HU_08 buscar por nombres, apellidos, correo, rol o estado */
export async function listar(p: z.infer<typeof filtroUsuarios>) {
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
  return { ...pagina(filas.map(aUsuario), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos }
}

/** HU_12 · Ver detalle */
export async function detalle(id: number) {
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

export const datosUsuario = z.object({
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
  // [Feedback 7] Con rol Cliente, los datos de su ficha de cliente
  cliente: z
    .object({ tipoDocumento, documento, direccion: textoOpcional(150) })
    .superRefine((c, ctx) => {
      const error = errorDocumento(c.tipoDocumento, c.documento)
      if (error) ctx.addIssue({ code: 'custom', path: ['documento'], message: error })
    })
    .optional(),
})
type DatosUsuario = z.infer<typeof datosUsuario>

const esRolCliente = async (rolId: number) =>
  (await unaFila<{ nombre: string }>(`SELECT nombre FROM rol WHERE id = $1`, [rolId]))?.nombre === 'Cliente'

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
export async function registrar(d: DatosUsuario) {
  await validarUnicos(d.nombreUsuario, d.correo)
  await validarRol(d.rolId)
  const temporal = contrasenaTemporal()

  // [Feedback 7] Un usuario con rol Cliente es también un cliente: se crea su
  // ficha o, si el administrador ya lo tenía registrado, se vincula a ella.
  const cliente = (await esRolCliente(d.rolId)) ? d.cliente : undefined
  if ((await esRolCliente(d.rolId)) && !cliente) {
    throw regla('FALTAN_DATOS_CLIENTE', 'Con rol Cliente, indica el tipo y número de documento del cliente.',
      { detalles: [{ campo: 'documento', mensaje: 'El documento es obligatorio para un usuario cliente.' }] })
  }
  const existente = cliente
    ? await unaFila<{ id: number; usuario_id: number | null; estado: string }>(
      `SELECT id, usuario_id, estado FROM cliente WHERE documento_identidad = $1`, [cliente.documento])
    : null
  if (existente?.usuario_id) {
    throw conflicto('DOCUMENTO_EN_USO', 'Ese cliente ya tiene una cuenta en el portal.',
      { detalles: [{ campo: 'documento', mensaje: 'Ese cliente ya tiene una cuenta en el portal.' }] })
  }
  if (existente?.estado === 'inactivo') throw regla('CLIENTE_INACTIVO', 'Ese cliente está inactivo: actívalo antes de crearle la cuenta.')
  if (cliente && await unaFila(`SELECT 1 FROM cliente WHERE correo = $1 AND id <> $2`, [d.correo, existente?.id ?? 0])) {
    throw conflicto('CORREO_DUPLICADO', 'Ese correo ya está registrado para otro cliente.',
      { detalles: [{ campo: 'correo', mensaje: 'Ese correo ya está registrado para otro cliente.' }] })
  }

  const id = await enTransaccion(async (tx) => {
    // CA_07_03 · solo el hash queda en la base
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO usuario (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
      [d.rolId, d.nombreUsuario, d.correo, await bcrypt.hash(temporal, 10), d.nombres, d.apellidos, d.telefono],
      tx,
    )
    if (cliente && existente) {
      await consultar(
        `UPDATE cliente SET usuario_id = $2, tipo_documento = $3, nombres = $4, apellidos = $5, telefono = $6, correo = $7,
                direccion = coalesce($8, direccion)
          WHERE id = $1`,
        [existente.id, fila!.id, cliente.tipoDocumento, d.nombres, d.apellidos, d.telefono, d.correo, cliente.direccion],
        tx,
      )
    } else if (cliente) {
      await consultar(
        `INSERT INTO cliente (tipo_documento, documento_identidad, nombres, apellidos, telefono, direccion, correo, usuario_id, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'activo')`,
        [cliente.tipoDocumento, cliente.documento, d.nombres, d.apellidos, d.telefono, cliente.direccion, d.correo, fila!.id],
        tx,
      )
    }
    return fila!.id
  })
  return { usuario: await detalle(id), contrasenaTemporal: temporal, clienteVinculado: Boolean(existente) }
}

/** HU_10 · Editar. `propio`: id de quien edita. */
export async function editar(id: number, d: DatosUsuario, propio: number) {
  const actual = await detalle(id)
  await validarUnicos(d.nombreUsuario, d.correo, id)
  await validarRol(d.rolId, actual.rol.id)
  if (id === propio && d.rolId !== actual.rol.id) {
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
  return detalle(id)
}

export const datosEstado = z.object({ estado: z.enum(['activo', 'inactivo']) })

/** HU_11 · Cambiar estado (CA_11_03: los usuarios no se eliminan). `propio`: id de quien cambia. */
export async function cambiarEstado(id: number, estado: 'activo' | 'inactivo', propio: number) {
  const actual = await detalle(id)
  if (id === propio && estado === 'inactivo') {
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
  return detalle(id)
}

/** Restablecer la contraseña de una cuenta desde administración (temporal, una vez). */
export async function restablecerContrasena(id: number) {
  await detalle(id)
  const temporal = contrasenaTemporal()
  await consultar(
    `UPDATE usuario SET contrasena_hash = $2, version_sesion = version_sesion + 1,
            token_recuperacion = NULL, token_vence = NULL
      WHERE id = $1`,
    [id, await bcrypt.hash(temporal, 10)],
  )
  return { contrasenaTemporal: temporal }
}
