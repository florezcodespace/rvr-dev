import type { ResumenDashboard } from '../types'

export interface DashboardService {
  /** Todo lo que pinta la vista en una sola llamada (el backend la resolverá con vistas SQL). */
  obtenerResumen(): Promise<ResumenDashboard>
}
