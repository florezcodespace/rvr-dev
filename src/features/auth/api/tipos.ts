/** Cuenta de la sesión: la devuelve la API en /auth/login y /auth/perfil. */
export type TipoCuenta = 'administrativo' | 'cliente' | 'tecnico'

export interface Cuenta {
  id: number
  nombreUsuario: string
  nombres: string
  apellidos: string
  nombre: string
  correo: string
  telefono: string
  estado: 'activo' | 'inactivo'
  rol: { id: number; nombre: string }
  /** Permisos activos del rol, como «modulo.nombre». */
  permisos: string[]
  tipo: TipoCuenta
  clienteId: number | null
  tecnicoId: number | null
}

export interface Sesion {
  usuario: Cuenta
  token: string
  /** ISO 8601. Cuando expira, la sesión se descarta al rehidratar. */
  expiraEn: string
}

export interface DatosRegistro {
  documento: string
  nombres: string
  apellidos: string
  telefono: string
  direccion: string
  correo: string
  contrasena: string
  confirmacion: string
}
