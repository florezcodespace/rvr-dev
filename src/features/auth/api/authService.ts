import type { CredencialesLogin, Sesion, Usuario } from '../types'

/**
 * Contrato de autenticación.
 * La vista solo conoce esta interfaz: al conectar el backend real basta con
 * exportar otra implementación desde `./index.ts`, sin tocar componentes.
 */
export interface AuthService {
  login(credenciales: CredencialesLogin): Promise<Sesion>
  logout(): Promise<void>
  /** Rehidrata la sesión persistida (o null si no hay / está vencida). */
  restaurarSesion(): Promise<Sesion | null>
  perfilActual(): Promise<Usuario | null>
}
