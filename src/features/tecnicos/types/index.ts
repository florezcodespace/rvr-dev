import type { EstadoTecnico } from '@shared/domain/estados'

/** Tarjeta del listado: `tecnicos` + agregados de agenda y cumplimiento. */
export interface Tecnico {
  id: number
  nombre: string
  especialidad: string
  estado: EstadoTecnico
  /** Etiquetas de habilidades (chips). */
  habilidades: string[]
  ordenesHoy: number
  cumplimientoSla: number
  zona: string
  telefono: string
}

export const TABS_TECNICO = ['todos', 'disponibles', 'en_ruta', 'fuera_turno'] as const
export type TabTecnico = (typeof TABS_TECNICO)[number]

export interface ParamsTecnicos {
  tab: TabTecnico
  q: string
  pagina: number
}

export interface ListadoTecnicos {
  items: Tecnico[]
  resumen: {
    disponibles: number
    activos: number
    enRuta: number
    ordenesHoy: number
    promedioPorTecnico: number
    cumplimientoSla: number
  }
  conteos: Record<TabTecnico, number>
}
