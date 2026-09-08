import type { EstadoCliente } from '@shared/domain/estados'
import type { ListadoClientes, ParamsClientes } from '../types'

export interface ClientesService {
  listar(params: ParamsClientes): Promise<ListadoClientes>
  cambiarEstado(id: number, estado: EstadoCliente): Promise<void>
}
