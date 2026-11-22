import { randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { consultar, type Conexion, pool, unaFila } from '../db.js'
import { conflicto, regla } from './errores.js'

/**
 * [Feedback 7] Cuentas del portal ligadas a un cliente.
 *
 * Antes solo el registro web creaba usuario + cliente a la vez. Ahora lo
 * hacen también «Registrar cliente» (con acceso al portal) y «Registrar
 * usuario» (con rol Cliente), y los tres usan estas mismas funciones.
 */

/** Contraseña temporal legible: RvR-7K2M-Q9XT (sin 0/O ni 1/I). */
export function contrasenaTemporal(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bloque = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join('')
  return `RvR-${bloque()}-${bloque()}`
}

/** Nombre de usuario libre a partir del correo: ana.suarez, ana.suarez2… */
export async function nombreUsuarioLibre(correo: string, conexion: Conexion = pool): Promise<string> {
  const base = correo.split('@')[0]!.replace(/[^a-z0-9._-]/gi, '').slice(0, 40).toLowerCase() || 'cliente'
  const usados = await consultar<{ nombre_usuario: string }>(
    `SELECT nombre_usuario FROM usuario WHERE nombre_usuario ~ ('^' || $1 || '[0-9]*$')`,
    [base.replace(/[.]/g, '\\.')],
    conexion,
  )
  const set = new Set(usados.map((u) => u.nombre_usuario))
  if (!set.has(base)) return base
  for (let i = 2; ; i++) if (!set.has(`${base}${i}`)) return `${base}${i}`
}

/** Id del rol Cliente, o error si está inactivo. */
export async function rolCliente(conexion: Conexion = pool): Promise<number> {
  const rol = await unaFila<{ id: number }>(`SELECT id FROM rol WHERE nombre = 'Cliente' AND estado = 'activo'`, [], conexion)
  if (!rol) throw regla('ROL_CLIENTE_INACTIVO', 'El rol Cliente está inactivo: actívalo para dar acceso al portal.')
  return rol.id
}

/** El correo no puede estar en otra cuenta del sistema. */
export async function correoLibreEnCuentas(correo: string, excepto = 0, conexion: Conexion = pool) {
  if (await unaFila(`SELECT 1 FROM usuario WHERE correo = $1 AND id <> $2`, [correo, excepto], conexion)) {
    throw conflicto('CORREO_EN_USO', 'Ese correo ya está en uso por otra cuenta del sistema.', {
      detalles: [{ campo: 'correo', mensaje: 'Ese correo ya está en uso por otra cuenta del sistema.' }],
    })
  }
}

/**
 * Crea la cuenta del portal de un cliente que aún no la tiene y la vincula.
 * Devuelve la contraseña temporal para mostrarla una sola vez.
 */
export async function crearCuentaCliente(
  conexion: Conexion,
  c: { clienteId: number; correo: string; nombres: string; apellidos: string; telefono: string | null },
) {
  await correoLibreEnCuentas(c.correo, 0, conexion)
  const rolId = await rolCliente(conexion)
  const nombreUsuario = await nombreUsuarioLibre(c.correo, conexion)
  const temporal = contrasenaTemporal()
  const usuario = await unaFila<{ id: number }>(
    `INSERT INTO usuario (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
    [rolId, nombreUsuario, c.correo, await bcrypt.hash(temporal, 10), c.nombres, c.apellidos, c.telefono],
    conexion,
  )
  await consultar(`UPDATE cliente SET usuario_id = $2 WHERE id = $1`, [c.clienteId, usuario!.id], conexion)
  return { usuarioId: usuario!.id, nombreUsuario, contrasenaTemporal: temporal }
}
