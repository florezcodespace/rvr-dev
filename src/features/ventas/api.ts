import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoOrden, EstadoPago, MetodoPago } from '@shared/domain/estados'

export interface Venta {
  id: number
  orden: { id: number; codigo: string; estado: EstadoOrden }
  cliente: { id: number; nombre: string } | null
  montoTotal: number
  montoAnticipo: number
  abonado: number
  saldo: number
  anticipoCubierto: boolean
  estadoPago: EstadoPago
  fecha: string
}

export interface AbonoVenta {
  id: number
  monto: number
  tipo: 'anticipo' | 'saldo'
  metodo: MetodoPago
  referencia: string
  fecha: string
}

export interface VentaDetalle extends Venta {
  abonos: AbonoVenta[]
}

export interface Abono {
  id: number
  ventaId: number
  orden: { id: number; codigo: string }
  cliente: string
  monto: number
  tipo: 'anticipo' | 'saldo'
  metodo: MetodoPago
  referencia: string
  fecha: string
  ventaAnulada: boolean
}

export const ventasService = {
  listar: (p: { q: string; pagina: number; estado: string; desde: string; hasta: string }) =>
    api.get<Pagina<Venta> & { conteos: Conteos }>('/ventas', p),
  detalle: (id: number) => api.get<VentaDetalle>(`/ventas/${id}`),
  ordenesSinVenta: () => api.get<{ id: number; codigo: string; cliente: string | null; total: number }[]>('/ventas/ordenes-sin-venta'),
  registrar: (ordenId: number, montoAnticipo: number | null) => api.post<VentaDetalle>('/ventas', { ordenId, montoAnticipo }),
  anular: (id: number, motivo: string | null) => api.patch<VentaDetalle>(`/ventas/${id}/estado`, { estado: 'anulada', motivo }),
  abonos: (p: { q: string; pagina: number; tipo: string; metodo: string; desde: string; hasta: string }) =>
    api.get<Pagina<Abono> & { totalFiltrado: number; metodos: string[] }>('/abonos', { ...p, porPagina: 15 }),
  ventasConSaldo: () => api.get<Venta[]>('/abonos/ventas-con-saldo'),
  registrarAbono: (d: { ventaId: number; monto: number; tipoAbono: 'anticipo' | 'saldo'; metodoPago: string; referencia: string | null }) =>
    api.post<{ abonoId: number; ordenEnProceso: boolean; venta: VentaDetalle }>('/abonos', d),
}
