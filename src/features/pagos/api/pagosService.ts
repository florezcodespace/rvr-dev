import type { EstadoPago } from '@shared/domain/estados'
import type { ListadoPagos, ParamsPagos } from '../types'

export interface PagosService {
  listar(params: ParamsPagos): Promise<ListadoPagos>
  cambiarEstado(id: number, estado: EstadoPago): Promise<void>
}
