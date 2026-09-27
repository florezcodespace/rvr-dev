import { api } from '@shared/lib/api'
import type { EstadoOrden, EstadoVisita } from '@shared/domain/estados'

export interface Visita {
  id: number
  orden: { id: number; codigo: string; estado: EstadoOrden }
  tecnico: { id: number; nombre: string }
  fechaProgramada: string
  horaFin: string | null
  estado: EstadoVisita
  notas: string
  enCurso: boolean
  inicio: string | null
  fin: string | null
  cliente: string
  direccion: string
  telefono: string
}

export interface FranjaLibre {
  id: number
  tecnicoId: number
  tecnico: string
  especialidad: string
  fecha: string
  horaInicio: string
  horaFin: string
}

export interface OrdenAgendable {
  id: number
  codigo: string
  estado: EstadoOrden
  cliente: string | null
  direccion: string | null
  visitasPendientes: number
}

export const agendaService = {
  calendario: (p: { desde: string; hasta: string; tecnico?: string; estado?: string }) => api.get<Visita[]>('/agenda', p),
  ordenes: () => api.get<OrdenAgendable[]>('/agenda/ordenes'),
  tecnicos: () => api.get<{ id: number; nombre: string; especialidad: string | null; estado: string }[]>('/tecnicos/opciones'),
  especialidades: () => api.get<string[]>('/tecnicos/especialidades'),
  libres: (p: { fecha: string; especialidad?: string }) => api.get<FranjaLibre[]>('/disponibilidad/libres', p),
  agendar: (d: { ordenId: number; disponibilidadId: number; notas: string | null }) => api.post<Visita>('/agenda', d),
  reprogramar: (id: number, d: { disponibilidadId: number; notas: string | null }) => api.post<Visita>(`/agenda/${id}/reprogramar`, d),
  cambiarEstado: (id: number, estado: 'cumplida' | 'cancelada' | 'pendiente', notas: string | null) => api.patch<Visita>(`/agenda/${id}/estado`, { estado, notas }),
}
