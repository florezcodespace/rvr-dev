import type { EstadoTecnico } from '@shared/domain/estados'
import type { ListadoTecnicos, ParamsTecnicos } from '../types'

export interface TecnicosService {
  listar(params: ParamsTecnicos): Promise<ListadoTecnicos>
  cambiarEstado(id: number, estado: EstadoTecnico): Promise<void>
}
