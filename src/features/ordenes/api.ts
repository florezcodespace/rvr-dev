import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoCotizacion, EstadoItem, EstadoOrden, EstadoPago, EstadoVisita } from '@shared/domain/estados'

export interface OrdenResumen {
  id: number
  codigo: string
  fechaCreacion: string
  estado: EstadoOrden
  cliente: { id: number; nombre: string; documento: string } | null
  servicios: string
  montoVenta: number | null
  saldo: number | null
  estadoPago: EstadoPago | null
  tecnico: { id: number; nombre: string } | null
  proximaVisita: string | null
}

export interface OrdenDetalle extends Omit<OrdenResumen, 'cliente'> {
  observaciones: string
  cliente: { id: number; nombre: string; documento: string; telefono: string; direccion: string } | null
  transiciones: EstadoOrden[]
  items: { id: number; tipo: 'servicio' | 'repuesto'; nombre: string; cantidad: number; precioUnitario: number; subtotal: number; fechaAsignacion: string; estado: EstadoItem; notas: string; cotizacionId: number }[]
  totalItems: number
  visitas: { id: number; tecnico: { id: number; nombre: string; telefono: string }; fechaProgramada: string; estado: EstadoVisita; notas: string; inicio: string | null; fin: string | null }[]
  reporteTecnico: {
    diagnostico: string | null
    fechaDiagnostico: string | null
    solucion: string | null
    fechaSolucion: string | null
    tecnico: string | null
    materiales: { id: number; descripcion: string; cantidad: number; fecha: string; tecnico: string | null }[]
  }
  venta: { id: number; montoTotal: number; montoAnticipo: number; abonado: number; saldo: number; estadoPago: EstadoPago; fecha: string } | null
  abonos: { id: number; monto: number; tipo: string; metodo: string; referencia: string; fecha: string }[]
  historial: { id: number; anterior: string | null; nuevo: string | null; descripcion: string; fecha: string; usuario: string | null }[]
  cotizaciones: { id: number; numero: string; estado: EstadoCotizacion; montoTotal: number; origen: string; fecha: string; recotizacion: boolean }[]
}

export const ordenesService = {
  listar: (p: { q: string; pagina: number; estado: string; tecnico: string; desde: string; hasta: string; orden: string }) =>
    api.get<Pagina<OrdenResumen> & { conteos: Conteos }>('/ordenes', p),
  detalle: (id: number) => api.get<OrdenDetalle>(`/ordenes/${id}`),
  tecnicos: () => api.get<{ id: number; nombre: string; estado: string }[]>('/tecnicos/opciones'),
  cotizacionesAprobadas: () =>
    api.get<{ id: number; numero: string; cliente: string; montoTotal: number; fechaAprobacion: string | null; items: number }[]>('/ordenes/cotizaciones-aprobadas'),
  registrar: (cotizacionId: number, observaciones: string | null) => api.post<OrdenDetalle>('/ordenes', { cotizacionId, observaciones }),
  observaciones: (id: number, observaciones: string | null) => api.patch<OrdenDetalle>(`/ordenes/${id}/observaciones`, { observaciones }),
  item: (id: number, itemId: number, cambios: { estado?: EstadoItem; notas?: string }) => api.patch<OrdenDetalle>(`/ordenes/${id}/items/${itemId}`, cambios),
  cambiarEstado: (id: number, estado: EstadoOrden, motivo: string | null) => api.patch<OrdenDetalle>(`/ordenes/${id}/estado`, { estado, motivo }),
}
