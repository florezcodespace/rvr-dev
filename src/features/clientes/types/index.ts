import type { EstadoCliente } from '@shared/domain/estados'
import type { Pagina } from '@shared/lib/paginar'

/** Fila del listado: `clientes` + agregados de órdenes y facturación. */
export interface Cliente {
  id: number
  nombre: string
  documento: string
  sector: string
  ordenes: number
  facturacion: number
  estado: EstadoCliente
  /** ISO date de la última orden registrada. */
  ultimaOrden: string
  correo: string
  telefono: string
  ciudad: string
}

export const TABS_CLIENTE = ['todos', 'activos', 'con_saldo', 'inactivos'] as const
export type TabCliente = (typeof TABS_CLIENTE)[number]

export interface ParamsClientes {
  tab: TabCliente
  q: string
  pagina: number
}

export interface ListadoClientes {
  pagina: Pagina<Cliente>
  resumen: {
    activos: number
    total: number
    nuevosMes: number
    conSaldo: number
    valorSaldo: number
    facturacionAnual: number
  }
  conteos: Record<TabCliente, number>
}
