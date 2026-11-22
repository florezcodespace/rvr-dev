import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoRegistro } from '@shared/domain/estados'

export interface Permiso {
  id: number
  nombre: string
  modulo: string
  moduloNombre: string
  clave: string
  descripcion: string
  estado: EstadoRegistro
  roles: number
  rolesActivos: number
}

export interface PermisoDetalle extends Permiso {
  listaRoles: { id: number; nombre: string; estado: EstadoRegistro; usuariosActivos: number }[]
}

export interface Modulo {
  clave: string
  nombre: string
  proceso: string
}

export interface DatosPermiso {
  nombre: string
  modulo: string
  descripcion: string | null
  confirmar?: boolean
}

export const permisosService = {
  listar: (p: { q: string; pagina: number; estado: string; modulo: string }) =>
    api.get<Pagina<Permiso> & { conteos: Conteos }>('/permisos', { ...p, porPagina: 15 }),
  modulos: () => api.get<Modulo[]>('/permisos/modulos'),
  detalle: (id: number) => api.get<PermisoDetalle>(`/permisos/${id}`),
  registrar: (d: DatosPermiso) => api.post<PermisoDetalle>('/permisos', d),
  editar: (id: number, d: DatosPermiso) => api.put<PermisoDetalle>(`/permisos/${id}`, d),
  cambiarEstado: (id: number, estado: EstadoRegistro) => api.patch<PermisoDetalle>(`/permisos/${id}/estado`, { estado }),
}
