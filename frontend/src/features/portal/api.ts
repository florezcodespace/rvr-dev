import { api, pedir } from '@shared/lib/api'
import type { CategoriaServicio, EstadoCotizacion, EstadoItem, EstadoOrden, EstadoPago, EstadoVisita } from '@shared/domain/estados'
import type { Cuenta } from '@features/auth'
import type { EstadoRevision } from '@shared/domain/estados'
import type { GarantiaDetalle } from '@shared/domain/garantias'

export interface ServicioCatalogo {
  id: number
  nombre: string
  descripcion: string
  precioBase: number
  categoria: CategoriaServicio
  duracionMin: number
  diasGarantia: number
}

export interface Perfil {
  id: number
  tipoDocumento: string
  documento: string
  nombres: string
  apellidos: string
  telefono: string
  direccion: string
  correo: string
  fechaRegistro: string
  estado: string
}

export interface Resumen {
  por_decidir: number
  en_valoracion: number
  ordenes_activas: number
  ordenes_finalizadas: number
  saldo: number
  proximaVisita: { fecha: string; tecnico: string; codigo: string; ordenId: number } | null
}

export interface MiCotizacion {
  id: number
  numero: string
  fecha: string
  estado: EstadoCotizacion
  montoTotal: number | null
  items: number
  resumen: string
  recotizacion: boolean
}

export interface MiCotizacionDetalle {
  id: number
  numero: string
  fecha: string
  estado: EstadoCotizacion
  montoTotal: number | null
  origen: string
  descripcion: string
  direccion: string
  fechaEnvio: string | null
  fechaRespuesta: string | null
  motivoRechazo: string
  orden: { id: number; codigo: string } | null
  ordenOrigen: { id: number; codigo: string } | null
  detalle: { id: number; tipo: 'servicio' | 'repuesto'; nombre: string; categoria: string; cantidad: number; precioUnitario: number | null; subtotal: number | null }[]
}

export interface MiOrden {
  id: number
  codigo: string
  estado: EstadoOrden
  fecha: string
  servicios: string
  fechaVisita: string | null
  saldo: number | null
}

export interface MiOrdenDetalle {
  id: number
  codigo: string
  estado: EstadoOrden
  fechaCreacion: string
  items: { id: number; tipo: string; nombre: string; cantidad: number; subtotal: number; estado: EstadoItem }[]
  visitas: { id: number; tecnico: string; fechaProgramada: string; estado: EstadoVisita; inicio: string | null; fin: string | null }[]
  venta: { id: number; montoTotal: number; montoAnticipo: number; abonado: number; saldo: number; estadoPago: EstadoPago } | null
  abonos: { id: number; monto: number; tipo: string; metodo: string; fecha: string }[]
  solucion: string | null
  diagnostico: string | null
  historial: { fecha: string; estado: EstadoOrden; descripcion: string }[]
  cotizaciones: { id: number; numero: string; estado: EstadoCotizacion; montoTotal: number; recotizacion: boolean }[]
  /** [Feedback 12] */
  comprobantes: { id: number; monto: number; metodo: string; referencia: string; detalle: { etiqueta: string; valor: string }[]; estado: EstadoRevision; motivoRechazo: string; fecha: string }[]
  /** [Feedback 13] */
  garantia: GarantiaDetalle | null
}

/** Archivo leído en el navegador como data URL. */
export interface ArchivoAdjunto {
  nombre: string
  tipo: string
  datos: string
}

export const portalService = {
  catalogo: (p: { q?: string; categoria?: string }) =>
    pedir<{ categorias: CategoriaServicio[]; items: ServicioCatalogo[] }>('/publico/servicios', { params: p, sinSesion: true }),
  resumen: () => api.get<Resumen>('/portal/resumen'),
  perfil: () => api.get<Perfil>('/portal/perfil'),
  actualizarPerfil: (d: { nombres: string; apellidos: string; telefono: string; direccion: string; correo: string }) =>
    api.put<{ perfil: Perfil; cuenta: Cuenta }>('/portal/perfil', d),
  solicitar: (d: { items: { servicioId: number; cantidad: number }[]; descripcion: string; direccion: string }) =>
    api.post<{ id: number; numero: string; mensaje: string }>('/portal/solicitudes', d),
  cotizaciones: () => api.get<MiCotizacion[]>('/portal/cotizaciones'),
  cotizacion: (id: number) => api.get<MiCotizacionDetalle>(`/portal/cotizaciones/${id}`),
  enviarComprobante: (ordenId: number, d: { monto: number; metodoPago: string; referencia: string | null; detalle: Record<string, string | number> | null; archivo: ArchivoAdjunto }) =>
    api.post<{ id: number; mensaje: string }>(`/portal/ordenes/${ordenId}/comprobantes`, d),
  reclamarGarantia: (ordenId: number, descripcion: string) =>
    api.post<{ id: number; mensaje: string }>(`/portal/ordenes/${ordenId}/garantia`, { descripcion }),
  decidir: (id: number, decision: 'aprobada' | 'rechazada', motivo: string | null) =>
    api.post<{ mensaje: string }>(`/portal/cotizaciones/${id}/decision`, { decision, motivo }),
  ordenes: () => api.get<MiOrden[]>('/portal/ordenes'),
  orden: (id: number) => api.get<MiOrdenDetalle>(`/portal/ordenes/${id}`),
}
