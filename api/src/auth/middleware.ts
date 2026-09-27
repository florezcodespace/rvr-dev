import type { NextFunction, Request, Response } from 'express'
import { unaFila } from '../db.js'
import { ErrorHttp } from '../errores.js'
import { verificar } from './sesion.js'

export interface Sesion {
  usuarioId: number
  canal: 'web' | 'movil'
  nombre: string
  rolId: number
  rol: string
  permisos: Set<string>
  /** Cliente vinculado a la cuenta (portal del cliente). */
  clienteId: number | null
  /** Técnico vinculado a la cuenta (aplicación móvil). */
  tecnicoId: number | null
}

declare module 'express-serve-static-core' {
  interface Request {
    sesion?: Sesion
  }
}

interface FilaSesion {
  id: number
  estado: string
  version_sesion: number
  nombre: string
  rol_id: number
  rol: string
  rol_estado: string
  permisos: string[] | null
  cliente_id: number | null
  cliente_estado: string | null
  tecnico_id: number | null
  tecnico_estado: string | null
}

/**
 * Exige un token válido y vuelve a leer la cuenta en cada petición.
 *
 * RNF-021: los permisos se leen de la base, no del token. Si el administrador
 * le quita un permiso a un rol o inactiva una cuenta, el cambio aplica en la
 * siguiente petición, sin esperar a que el token caduque (CA_11_02, CA_83_04).
 */
async function cargarSesion(req: Request): Promise<void> {
  const cabecera = req.headers.authorization ?? ''
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : ''
  const contenido = token ? verificar(token) : null
  if (!contenido) throw new ErrorHttp(401, 'SESION_INVALIDA', 'Tu sesión expiró. Ingresa de nuevo.')

  const fila = await unaFila<FilaSesion>(
    `SELECT u.id, u.estado, u.version_sesion, trim(u.nombres || ' ' || u.apellidos) AS nombre,
            r.id AS rol_id, r.nombre AS rol, r.estado AS rol_estado,
            (SELECT array_agg(p.modulo || '.' || p.nombre)
               FROM rol_x_permiso x JOIN permiso p ON p.id = x.permiso_id
              WHERE x.rol_id = r.id AND p.estado = 'activo') AS permisos,
            c.id AS cliente_id, c.estado AS cliente_estado,
            t.id AS tecnico_id, t.estado AS tecnico_estado
       FROM usuario u
       JOIN rol r          ON r.id = u.rol_id
       LEFT JOIN cliente c ON c.usuario_id = u.id
       LEFT JOIN tecnico t ON t.usuario_id = u.id
      WHERE u.id = $1`,
    [contenido.usuarioId],
  )

  if (!fila || fila.version_sesion !== contenido.ver) {
    throw new ErrorHttp(401, 'SESION_INVALIDA', 'Tu sesión se cerró. Ingresa de nuevo.')
  }
  if (fila.estado !== 'activo' || fila.cliente_estado === 'inactivo') {
    throw new ErrorHttp(401, 'USUARIO_INACTIVO', 'Tu cuenta está inactiva. Comunícate con RvR Tecnologías.')
  }
  if (fila.rol_estado !== 'activo') {
    throw new ErrorHttp(401, 'ROL_INACTIVO', 'Tu rol fue desactivado. Comunícate con el administrador.')
  }

  req.sesion = {
    usuarioId: fila.id,
    canal: contenido.canal,
    nombre: fila.nombre,
    rolId: fila.rol_id,
    rol: fila.rol,
    permisos: new Set(fila.permisos ?? []),
    clienteId: fila.cliente_id,
    tecnicoId: fila.tecnico_estado === 'activo' ? fila.tecnico_id : null,
  }
}

/** Middleware de sesión: carga la cuenta y sigue, o corta con 401. */
export function sesion(req: Request, _res: Response, next: NextFunction) {
  cargarSesion(req).then(() => next(), next)
}

/**
 * Exige al menos uno de los permisos indicados («modulo.nombre»). Va después
 * de `sesion`. CA_03_04, CA_09_04, CA_68_04, CA_74_05…
 */
export function permiso(...requeridos: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const propios = req.sesion?.permisos
    if (!propios || !requeridos.some((p) => propios.has(p))) {
      next(new ErrorHttp(403, 'SIN_PERMISO', 'Tu rol no tiene permiso para esta acción.', { requiere: requeridos }))
      return
    }
    next()
  }
}

export const tiene = (req: Request, clave: string) => req.sesion?.permisos.has(clave) ?? false
