import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoRegistro } from '@shared/domain/estados'

export interface Rol {
  id: number
  nombre: string
  descripcion: string
  estado: EstadoRegistro
  permisos: number
  usuarios: number
  usuariosActivos: number
}

export interface PermisoBasico {
  id: number
  nombre: string
  modulo: string
  descripcion: string
  estado: EstadoRegistro
  clave?: string
}

export interface GrupoPermisos {
  modulo: string
  nombre: string
  proceso: string
  permisos: PermisoBasico[]
}

export interface RolDetalle extends Rol {
  permisoIds: number[]
  porModulo: GrupoPermisos[]
  listaUsuarios: { id: number; nombreUsuario: string; nombre: string; correo: string; estado: EstadoRegistro }[]
}

export interface DatosRol {
  nombre: string
  descripcion: string | null
  permisos: number[]
}

export const rolesService = {
  listar: (p: { q: string; pagina: number; estado: string }) => api.get<Pagina<Rol> & { conteos: Conteos }>('/roles', p),
  detalle: (id: number) => api.get<RolDetalle>(`/roles/${id}`),
  catalogo: () => api.get<GrupoPermisos[]>('/permisos/catalogo'),
  registrar: (d: DatosRol) => api.post<RolDetalle>('/roles', d),
  editar: (id: number, d: DatosRol) => api.put<RolDetalle>(`/roles/${id}`, d),
  cambiarEstado: (id: number, estado: EstadoRegistro) => api.patch<RolDetalle>(`/roles/${id}/estado`, { estado }),
  eliminar: (id: number) => api.delete(`/roles/${id}`),
}

/** Roles base que la API no deja eliminar (login, portal y app móvil dependen de ellos). */
export const ROLES_SISTEMA = [1, 2, 3]

export const motivoNoEliminar = (r: Pick<Rol, 'id' | 'usuarios'>) =>
  ROLES_SISTEMA.includes(r.id) ? 'Rol base del sistema: no se puede eliminar'
    : r.usuarios > 0 ? `Tiene ${r.usuarios} usuario(s) asignado(s)` : undefined

export { partirDescripcion } from '@shared/lib/permisos'
