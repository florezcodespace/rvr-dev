import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoCotizacion } from '@shared/domain/estados'

export interface CotizacionResumen {
  id: number
  numero: string
  cliente: { id: number; nombre: string; documento: string }
  fecha: string
  montoTotal: number
  estado: EstadoCotizacion
  origen: 'cliente' | 'administrador' | 'tecnico'
  items: number
  fechaEnvio: string | null
  orden: { id: number; codigo: string } | null
  ordenOrigen: { id: number; codigo: string } | null
}

export interface ItemDetalle {
  id: number
  tipo: 'servicio' | 'repuesto'
  servicioId: number | null
  nombre: string
  categoria: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  precioActual: number | null
}

export interface CotizacionDetalle extends Omit<CotizacionResumen, 'cliente'> {
  cliente: { id: number; nombre: string; documento: string; telefono: string; correo: string; direccion: string; tieneCuenta: boolean }
  descripcion: string
  direccion: string
  fechaRespuesta: string | null
  motivoRechazo: string
  respondidaPor: string | null
  detalle: ItemDetalle[]
  editable: boolean
  valorada: boolean
}

export type ItemEntrada =
  | { tipo: 'servicio'; servicioId: number; cantidad: number }
  | { tipo: 'repuesto'; descripcion: string; cantidad: number; precioUnitario: number }

export interface OpcionCliente {
  id: number
  nombre: string
  documento: string
  direccion: string | null
  estado: string
}

export interface OpcionServicio {
  id: number
  nombre: string
  categoria: string
  precioBase: number
  estado: string
}

export const cotizacionesService = {
  listar: (p: { q: string; pagina: number; estado: string; origen: string; desde: string; hasta: string }) =>
    api.get<Pagina<CotizacionResumen> & { conteos: Conteos }>('/cotizaciones', p),
  detalle: (id: number) => api.get<CotizacionDetalle>(`/cotizaciones/${id}`),
  clientes: (q: string, id?: number) => api.get<OpcionCliente[]>('/clientes/opciones', { q, id }),
  servicios: () => api.get<Pagina<OpcionServicio>>('/servicios', { estado: 'activo', porPagina: 200 }).then((r) => r.items),
  registrar: (d: { clienteId: number; descripcion: string | null; direccion: string | null; items: ItemEntrada[] }) =>
    api.post<CotizacionDetalle>('/cotizaciones', d),
  editar: (id: number, d: { descripcion: string | null; direccion: string | null; items: ItemEntrada[] }) =>
    api.put<CotizacionDetalle & { requiereReenvio: boolean }>(`/cotizaciones/${id}`, d),
  enviar: (id: number) => api.post<CotizacionDetalle & { notificado: boolean }>(`/cotizaciones/${id}/enviar`),
  decidir: (id: number, decision: 'aprobada' | 'rechazada', motivo: string | null) =>
    api.post<CotizacionDetalle>(`/cotizaciones/${id}/decision`, { decision, motivo }),
  generarOrden: (cotizacionId: number) => api.post<{ id: number; codigo: string }>('/ordenes', { cotizacionId }),
}
