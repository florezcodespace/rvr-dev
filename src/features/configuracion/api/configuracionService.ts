import type { Configuracion } from '../types'

export interface ConfiguracionService {
  obtener(): Promise<Configuracion>
  guardar(configuracion: Configuracion): Promise<void>
}
