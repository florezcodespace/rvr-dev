import type { EstadoServicio } from '@shared/domain/estados'
import type { ListadoServicios, ParamsServicios } from '../types'

export interface ServiciosService {
  listar(params: ParamsServicios): Promise<ListadoServicios>
  cambiarEstado(id: number, estado: EstadoServicio): Promise<void>
}
