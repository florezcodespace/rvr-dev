import type { EstadoOrden } from '@shared/domain/estadoOrden'
import type {
  BloqueAgenda,
  CatalogosOrden,
  FiltrosOrdenes,
  ListadoOrdenes,
  NuevaOrden,
  OrdenResumen,
} from '../types'

export interface OrdenesService {
  /** Listado paginado + catálogos de filtro (el backend lo hará con query params). */
  listar(filtros: FiltrosOrdenes): Promise<ListadoOrdenes>
  /** Catálogos del formulario de creación. */
  catalogos(): Promise<CatalogosOrden>
  /** Franjas del técnico para la fecha dada (horarios_tecnicos + novedades). */
  agendaTecnico(tecnicoId: number, fecha: string): Promise<BloqueAgenda[]>
  crear(orden: NuevaOrden): Promise<OrdenResumen>
  /** Cambio de estado desde el badge del listado. */
  cambiarEstado(id: number, estado: EstadoOrden): Promise<void>
  /** Asignación de técnico desde la propia fila. */
  asignarTecnico(id: number, tecnicoId: number | null): Promise<void>
}
