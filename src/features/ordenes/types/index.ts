import type { EstadoOrden } from '@shared/domain/estadoOrden'

/** Fila del listado: proyección de `ordenes_servicio` + joins de cliente y técnico. */
export interface OrdenResumen {
  id: number
  /** Consecutivo visible (OS-0147). */
  codigo: string
  clienteId: number
  clienteNombre: string
  tecnicoId: number | null
  tecnicoNombre: string | null
  /** ISO 8601 */
  fechaSolicitud: string
  /** ISO 8601 o null si aún no se agenda. */
  fechaProgramada: string | null
  descripcionProblema: string
  estado: EstadoOrden
}

export interface FiltrosOrdenes {
  busqueda: string
  estados: EstadoOrden[]
  clienteId: number | null
  tecnicoId: number | null
  /** YYYY-MM-DD */
  desde: string | null
  hasta: string | null
  pagina: number
}

export interface OpcionFiltro {
  id: number
  nombre: string
}

export interface ListadoOrdenes {
  items: OrdenResumen[]
  /** Coincidencias con los filtros actuales. */
  total: number
  /** Total sin filtrar, para el subtítulo de la vista. */
  totalGeneral: number
  activas: number
  pagina: number
  porPagina: number
  clientes: OpcionFiltro[]
  tecnicos: OpcionFiltro[]
}

export const FILTROS_INICIALES: FiltrosOrdenes = {
  busqueda: '',
  estados: [],
  clienteId: null,
  tecnicoId: null,
  desde: null,
  hasta: null,
  pagina: 1,
}

/* ---------- Catálogos y creación (Vista 4) ---------- */

export interface ClienteDetalle extends OpcionFiltro {
  documento: string
  ciudad: string
  contacto: string
}

export interface ServicioCatalogo extends OpcionFiltro {
  categoria: string
  /** Horas estimadas; alimenta la sugerencia de agenda. */
  duracionHoras: number
  precio: number
  diasGarantia: number
}

export interface TecnicoCatalogo extends OpcionFiltro {
  especialidad: string
  /** Derivado de horarios_tecnicos + novedades_disponibilidad. */
  disponible: boolean
}

export interface CotizacionCatalogo {
  id: number
  codigo: string
  clienteId: number
  valorTotal: number
  estado: 'aprobada' | 'enviada'
}

export interface CatalogosOrden {
  clientes: ClienteDetalle[]
  servicios: ServicioCatalogo[]
  tecnicos: TecnicoCatalogo[]
  cotizaciones: CotizacionCatalogo[]
  /** Consecutivo que tomará la orden al guardarse. */
  siguienteCodigo: string
}

export interface BloqueAgenda {
  hora: string
  /** null = franja libre. */
  ocupadoPor: string | null
}

export interface NuevaOrden {
  clienteId: number
  servicioId: number
  tecnicoId: number | null
  cotizacionId: number | null
  fechaProgramada: string
  estadoInicial: EstadoOrden
  diagnostico: string
  observaciones: string
}
