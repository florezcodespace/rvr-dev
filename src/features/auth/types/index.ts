/**
 * Tipos del dominio de acceso.
 * Alineados con las tablas `usuarios`, `roles` y `log_accesos` del modelo relacional.
 */

export type EstadoGeneral = 'activo' | 'inactivo'

export interface Rol {
  id: number
  nombre: string
  descripcion?: string
}

export interface Usuario {
  id: number
  rol: Rol
  nombreUsuario: string
  correo: string
  estado: EstadoGeneral
  ultimoAcceso: string | null
}

export interface Sesion {
  usuario: Usuario
  token: string
  /** ISO 8601. Cuando expira, la sesión se descarta al rehidratar. */
  expiraEn: string
}

export interface CredencialesLogin {
  correo: string
  contrasena: string
  recordarme: boolean
}

/** Códigos de error que la vista sabe traducir a un mensaje. */
export type AuthErrorCode =
  | 'CREDENCIALES_INVALIDAS'
  | 'USUARIO_INACTIVO'
  | 'CUENTA_BLOQUEADA'
  | 'ERROR_RED'

export class AuthError extends Error {
  readonly code: AuthErrorCode
  /** Intentos restantes antes del bloqueo temporal, si aplica. */
  readonly intentosRestantes?: number

  constructor(code: AuthErrorCode, message: string, intentosRestantes?: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.intentosRestantes = intentosRestantes
  }
}
