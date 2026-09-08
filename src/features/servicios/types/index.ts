import type { EstadoServicio } from '@shared/domain/estados'

export type CategoriaServicio = 'soporte' | 'infraestructura' | 'seguridad' | 'datos'

/** Tarjeta del catálogo: `servicios` + `categorias_servicio`. */
export interface Servicio {
  id: number
  nombre: string
  descripcion: string
  categoria: CategoriaServicio
  precio: number
  /** Unidad sobre la que se cobra: "por equipo", "mensual"… */
  unidad: string
  ordenes: number
  diasGarantia: number
  estado: EstadoServicio
}

export const TABS_SERVICIO = [
  'todos',
  'soporte',
  'infraestructura',
  'seguridad',
  'borradores',
] as const
export type TabServicio = (typeof TABS_SERVICIO)[number]

export interface ParamsServicios {
  tab: TabServicio
  q: string
  pagina: number
}

export interface ListadoServicios {
  items: Servicio[]
  resumen: {
    publicados: number
    borradores: number
    masSolicitado: Servicio
    ingresoMes: number
    duracionPromedio: number
  }
  conteos: Record<TabServicio, number>
}

export const CATEGORIA_LABEL: Record<CategoriaServicio, string> = {
  soporte: 'Soporte',
  infraestructura: 'Infraestructura',
  seguridad: 'Seguridad',
  datos: 'Datos',
}
