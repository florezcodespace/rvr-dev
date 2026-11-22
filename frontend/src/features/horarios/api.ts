import { api } from '@shared/lib/api'
import type { EstadoFranja } from '@shared/domain/estados'

export interface Franja {
  id: number
  tecnicoId: number
  tecnico: string
  especialidad: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoFranja
  motivo: string
  visita: { id: number; ordenId: number; codigoOrden: string } | null
}

export interface OpcionTecnico {
  id: number
  nombre: string
  especialidad: string | null
  estado: 'activo' | 'inactivo'
}

export const horariosService = {
  consultar: (p: { tecnico?: string; especialidad?: string; estado?: string; desde: string; hasta: string }) =>
    api.get<Franja[]>('/disponibilidad', p),
  libres: (p: { fecha: string; tecnico?: string; especialidad?: string }) => api.get<Franja[]>('/disponibilidad/libres', p),
  tecnicos: () => api.get<OpcionTecnico[]>('/tecnicos/opciones'),
  especialidades: () => api.get<string[]>('/tecnicos/especialidades'),
  registrar: (d: { tecnicoId: number; fecha: string; horaInicio: string; horaFin: string; repetirHasta?: string | null; incluirSabados?: boolean }) =>
    api.post<{ creadas: number; cruzadas: string[] }>('/disponibilidad', d),
  cambiarEstado: (id: number, estado: EstadoFranja, motivo: string | null) => api.patch<Franja>(`/disponibilidad/${id}/estado`, { estado, motivo }),
}
