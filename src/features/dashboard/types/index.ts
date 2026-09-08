import type { EstadoOrden } from '@shared/domain/estadoOrden'

export type TonoKpi = 'primary' | 'warning' | 'success' | 'info'

export interface Kpi {
  id: string
  etiqueta: string
  valor: string
  /** Valor secundario que se muestra más pequeño (p. ej. " / 11"). */
  valorSecundario?: string
  detalle: string
  /** Resalta el detalle cuando exige acción. */
  detalleDestacado?: boolean
  glifo: string
  tono: TonoKpi
}

export interface PuntoTendencia {
  /** ISO date (YYYY-MM-DD) */
  fecha: string
  creadas: number
  completadas: number
}

export interface ConteoEstado {
  estado: EstadoOrden
  cantidad: number
}

export interface ServicioSolicitado {
  id: number
  nombre: string
  cantidad: number
}

export type TipoActividad = 'orden' | 'cotizacion' | 'agendamiento' | 'pago'

export interface EventoActividad {
  id: string
  tipo: TipoActividad
  titulo: string
  /** Fragmento resaltado dentro del título (p. ej. el estado). */
  destacado?: string
  detalle: string
  fecha: string
}

export interface ResumenDashboard {
  fecha: string
  serviciosAgendadosHoy: number
  ordenesPorAprobar: number
  kpis: Kpi[]
  tendencia: PuntoTendencia[]
  ordenesPorEstado: ConteoEstado[]
  serviciosMasSolicitados: ServicioSolicitado[]
  actividad: EventoActividad[]
}
