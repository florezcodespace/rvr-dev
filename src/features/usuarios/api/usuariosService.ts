import type { EstadoUsuario, RolUsuario } from '@shared/domain/estados'
import type { ListadoUsuarios, ParamsUsuarios } from '../types'

export interface UsuariosService {
  listar(params: ParamsUsuarios): Promise<ListadoUsuarios>
  cambiarEstado(id: number, estado: EstadoUsuario): Promise<void>
  /** Cambio de rol desde el propio badge del listado. */
  cambiarRol(id: number, rol: RolUsuario): Promise<void>
}
