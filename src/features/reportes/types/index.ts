import type { EstadoOrden } from '@shared/domain/estadoOrden'

export const RANGOS_REPORTE = ['30d', '90d', '6m', '12m'] as const
export type RangoReporte = (typeof RANGOS_REPORTE)[number]

export interface PuntoQuincena {
  /** Etiqueta ya formateada del eje (p. ej. "15 JUN"). */
  etiqueta: string
  creadas: number
  completadas: number
}

export interface ResumenReportes {
  desde: string
  hasta: string
  completadas: number
  cumplimientoSla: number
  ingresos: number
  variacionIngresos: number
  tiempoCierre: number
  variacionTiempo: number
  satisfaccion: number
  encuestas: number
  serie: PuntoQuincena[]
  porEstado: { estado: EstadoOrden; cantidad: number }[]
  servicios: { id: number; nombre: string; cantidad: number }[]
  tecnicos: { id: number; nombre: string; cerradas: number }[]
}
