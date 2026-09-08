import type { EstadoUsuario, RolUsuario } from '@shared/domain/estados'
import type { Pagina } from '@shared/lib/paginar'

/** Fila del listado: `usuarios` + `roles`. */
export interface UsuarioPortal {
  id: number
  nombre: string
  correo: string
  rol: RolUsuario
  estado: EstadoUsuario
  /** ISO datetime o null si nunca ha ingresado. */
  ultimoAcceso: string | null
}

export const TABS_USUARIO = [
  'todos',
  'administradores',
  'coordinacion',
  'tecnicos',
  'inactivos',
] as const
export type TabUsuario = (typeof TABS_USUARIO)[number]

export interface ParamsUsuarios {
  tab: TabUsuario
  q: string
  pagina: number
}

export interface ListadoUsuarios {
  pagina: Pagina<UsuarioPortal>
  resumen: {
    activos: number
    total: number
    administradores: number
    invitaciones: number
    sinIngresar30: number
  }
  conteos: Record<TabUsuario, number>
}
