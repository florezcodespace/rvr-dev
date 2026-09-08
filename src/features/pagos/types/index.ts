import type { EstadoPago } from '@shared/domain/estados'
import type { Pagina } from '@shared/lib/paginar'

export type MedioPago = 'transferencia' | 'tarjeta' | 'efectivo' | 'otro'

/** Fila del listado: `pagos` + joins de orden y cliente. */
export interface Pago {
  id: number
  recibo: string
  clienteNombre: string
  ordenCodigo: string
  valor: number
  medio: MedioPago
  estado: EstadoPago
  /** ISO date */
  fecha: string
}

export const TABS_PAGO = ['todos', 'por_conciliar', 'conciliados', 'vencidos'] as const
export type TabPago = (typeof TABS_PAGO)[number]

export interface ParamsPagos {
  tab: TabPago
  q: string
  pagina: number
}

export interface RecaudoMes {
  mes: string
  valor: number
}

export interface ListadoPagos {
  pagina: Pagina<Pago>
  resumen: {
    recaudadoMes: number
    metaMes: number
    porConciliar: number
    valorPorConciliar: number
    vencidos: number
    valorVencidos: number
    diasCobro: number
  }
  recaudo: RecaudoMes[]
  medios: { medio: MedioPago; porcentaje: number }[]
  conteos: Record<TabPago, number>
}

/** Etiqueta corta para la columna de la tabla. */
export const MEDIO_PAGO_CORTO: Record<MedioPago, string> = {
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

export const MEDIO_PAGO_LABEL: Record<MedioPago, string> = {
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta de crédito',
  efectivo: 'Efectivo',
  otro: 'Otros medios',
}
