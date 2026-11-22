import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface Contenido {
  usuarioId: number
  /** `usuario.version_sesion` al firmar: si cambia, el token deja de valer. */
  ver: number
  canal: 'web' | 'movil'
}

export function firmar(contenido: Contenido): { token: string; expiraEn: string } {
  // La app móvil del técnico mantiene la sesión la jornada completa y un poco más.
  const horas = contenido.canal === 'movil' ? Math.max(config.sesionHoras, 12) : config.sesionHoras
  const segundos = horas * 3600
  const token = jwt.sign(contenido, config.jwtSecret, { expiresIn: segundos })
  return {
    token,
    expiraEn: new Date(Date.now() + segundos * 1000).toISOString(),
  }
}

export function verificar(token: string): Contenido | null {
  try {
    const contenido = jwt.verify(token, config.jwtSecret) as Partial<Contenido>
    if (typeof contenido.usuarioId !== 'number') return null
    return {
      usuarioId: contenido.usuarioId,
      ver: contenido.ver ?? 0,
      canal: contenido.canal === 'movil' ? 'movil' : 'web',
    }
  } catch {
    return null
  }
}
