import type { CotizacionesService } from './cotizacionesService'
import { mockCotizacionesService } from './mockCotizacionesService'

/** Punto único de intercambio mock ↔ API real. */
export const cotizacionesService: CotizacionesService = mockCotizacionesService

export type { CotizacionesService }
