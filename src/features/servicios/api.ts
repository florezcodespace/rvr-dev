import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { CategoriaServicio, EstadoRegistro } from '@shared/domain/estados'

export interface Servicio {
  id: number
  nombre: string
  descripcion: string
  precioBase: number
  estado: EstadoRegistro
  categoria: CategoriaServicio
  vecesCotizado?: number
}

export interface ServicioDetalle extends Servicio {
  uso: { cotizaciones: number; unidades: number; ordenes: number; ingresos: number }
}

export interface DatosServicio {
  nombre: string
  descripcion: string | null
  categoria: string
  precioBase: number
}

export const serviciosService = {
  listar: (p: { q: string; pagina: number; estado: string; categoria: string }) => api.get<Pagina<Servicio> & { conteos: Conteos }>('/servicios', p),
  detalle: (id: number) => api.get<ServicioDetalle>(`/servicios/${id}`),
  registrar: (d: DatosServicio) => api.post<ServicioDetalle>('/servicios', d),
  editar: (id: number, d: DatosServicio) => api.put<ServicioDetalle>(`/servicios/${id}`, d),
  cambiarEstado: (id: number, estado: EstadoRegistro) => api.patch<ServicioDetalle>(`/servicios/${id}/estado`, { estado }),
}
