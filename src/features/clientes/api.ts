import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoCotizacion, EstadoOrden, EstadoRegistro } from '@shared/domain/estados'

export interface Cliente {
  id: number
  documento: string
  nombres: string
  apellidos: string
  nombre: string
  telefono: string
  direccion: string
  correo: string
  fechaRegistro: string
  estado: EstadoRegistro
  tieneCuenta: boolean
  cotizaciones: number
  ordenes: number
  ordenesEnCurso: number
}

export interface ClienteDetalle extends Cliente {
  cartera: { facturado: number; abonado: number; saldo: number }
  historialCotizaciones: { id: number; numero: string; fecha: string; estado: EstadoCotizacion; montoTotal: number; origen: string; orden: { id: number; codigo: string } | null }[]
  historialOrdenes: { id: number; codigo: string; fecha: string; estado: EstadoOrden; monto: number | null; saldo: number | null }[]
}

export interface DatosCliente {
  documento: string
  nombres: string
  apellidos: string
  telefono: string | null
  direccion: string | null
  correo: string | null
}

export const clientesService = {
  listar: (p: { q: string; pagina: number; estado: string; orden: string }) => api.get<Pagina<Cliente> & { conteos: Conteos }>('/clientes', p),
  detalle: (id: number) => api.get<ClienteDetalle>(`/clientes/${id}`),
  registrar: (d: DatosCliente) => api.post<ClienteDetalle>('/clientes', d),
  editar: (id: number, d: DatosCliente) => api.put<ClienteDetalle>(`/clientes/${id}`, d),
  cambiarEstado: (id: number, estado: EstadoRegistro, confirmar?: boolean) => api.patch<ClienteDetalle>(`/clientes/${id}/estado`, { estado, confirmar }),
}
