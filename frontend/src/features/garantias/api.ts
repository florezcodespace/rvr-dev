import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { Garantia, GarantiaDetalle } from '@shared/domain/garantias'

export type { Garantia, GarantiaDetalle }

/** [Feedback 13] Garantías y reclamos. */
export const garantiasService = {
  listar: (p: { q: string; pagina: number; estado: string }) => api.get<Pagina<Garantia> & { conteos: Conteos }>('/garantias', { ...p, porPagina: 15 }),
  detalle: (id: number) => api.get<GarantiaDetalle>(`/garantias/${id}`),
  aprobarReclamo: (id: number, respuesta: string | null) =>
    api.post<{ ordenId: number; codigo: string; garantiaId: number }>(`/garantias/reclamos/${id}/aprobar`, { respuesta }),
  rechazarReclamo: (id: number, respuesta: string) => api.post<{ garantiaId: number }>(`/garantias/reclamos/${id}/rechazar`, { respuesta }),
}
