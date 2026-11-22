import type { EstadoRevision } from './estados'

/** [Feedback 13] Garantía de una orden, como la devuelve la API. */
export interface Garantia {
  id: number
  orden: { id: number; codigo: string }
  cliente: { id: number; nombre: string } | null
  fechaInicio: string
  fechaFin: string
  diasRestantes: number
  vigente: boolean
  servicios: string
  reclamoEstado: EstadoRevision | null
  reclamos: number
}

export interface ReclamoGarantia {
  id: number
  descripcion: string
  estado: EstadoRevision
  respuesta: string
  fecha: string
  fechaRespuesta: string | null
  respondio: string
  ordenGarantia: { id: number; codigo: string } | null
}

export type GarantiaDetalle = Garantia & { historialReclamos: ReclamoGarantia[] }
