import type { OrdenesService } from './ordenesService'
import { mockOrdenesService } from './mockOrdenesService'

/** Punto único de intercambio mock ↔ API real. */
export const ordenesService: OrdenesService = mockOrdenesService

export type { OrdenesService }
export { POR_PAGINA } from './mockOrdenesService'
