import type { RangoReporte, ResumenReportes } from '../types'

export interface ReportesService {
  resumen(params: { rango: RangoReporte }): Promise<ResumenReportes>
}
