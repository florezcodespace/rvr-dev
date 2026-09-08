import type { EstadoCotizacion } from '@shared/domain/estados'
import type { Pagina } from '@shared/lib/paginar'

/** Fila del listado: `cotizaciones` + joins de cliente y servicio principal. */
export interface Cotizacion {
  id: number
  codigo: string
  clienteNombre: string
  servicioNombre: string
  valorTotal: number
  estado: EstadoCotizacion
  /** ISO date: hasta cuándo es válida la oferta. */
  vigencia: string
  version: number
}

export const TABS_COTIZACION = [
  'todas',
  'nuevas',
  'pendientes',
  'aprobadas',
  'canceladas',
] as const

export type TabCotizacion = (typeof TABS_COTIZACION)[number]

export interface ParamsCotizaciones {
  tab: TabCotizacion
  q: string
  pagina: number
}

export interface ResumenCotizaciones {
  enNegociacion: number
  valorEnNegociacion: number
  aprobadasMes: number
  tasaCierre: number
  porVencer: number
  ticketPromedio: number
}

export interface ListadoCotizaciones {
  pagina: Pagina<Cotizacion>
  resumen: ResumenCotizaciones
  conteos: Record<TabCotizacion, number>
}
