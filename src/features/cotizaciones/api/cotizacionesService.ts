import type { EstadoCotizacion } from '@shared/domain/estados'
import type { ListadoCotizaciones, ParamsCotizaciones } from '../types'

export interface CotizacionesService {
  listar(params: ParamsCotizaciones): Promise<ListadoCotizaciones>
  /** Cambio de estado desde el badge del listado. */
  cambiarEstado(id: number, estado: EstadoCotizacion): Promise<void>
}
