import type { AuthService } from './authService'
import { mockAuthService } from './mockAuthService'

/**
 * Punto único de intercambio mock ↔ API real.
 * Cuando exista el backend: crear `httpAuthService.ts` con la misma interfaz
 * y cambiar solo esta línea (o condicionarla con import.meta.env.VITE_API_URL).
 */
export const authService: AuthService = mockAuthService

export type { AuthService }
export { CREDENCIALES_DEMO } from './mockAuthService'
