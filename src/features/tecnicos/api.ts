import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoRegistro, EstadoVisita } from '@shared/domain/estados'

export interface Tecnico {
  id: number
  documento: string
  nombres: string
  apellidos: string
  nombre: string
  especialidad: string
  telefono: string
  correo: string
  estado: EstadoRegistro
  cuentaMovil: { usuarioId: number; estado: EstadoRegistro } | null
  visitasPendientes: number
  visitasCumplidas: number
}

export interface TecnicoDetalle extends Tecnico {
  franjasProximas: { disponibles: number; ocupadas: number; bloqueadas: number }
  visitas: {
    id: number; ordenId: number; codigoOrden: string; cliente: string; fechaProgramada: string
    estado: EstadoVisita; notas: string; inicio: string | null; fin: string | null
  }[]
}

export interface DatosTecnico {
  documento: string
  nombres: string
  apellidos: string
  especialidad: string | null
  telefono: string | null
  correo: string | null
  crearCuenta?: boolean
}

export interface CuentaMovil {
  correo: string
  nombreUsuario: string
  contrasenaTemporal: string
}

export const tecnicosService = {
  listar: (p: { q: string; pagina: number; estado: string; especialidad: string }) => api.get<Pagina<Tecnico> & { conteos: Conteos }>('/tecnicos', p),
  especialidades: () => api.get<string[]>('/tecnicos/especialidades'),
  detalle: (id: number) => api.get<TecnicoDetalle>(`/tecnicos/${id}`),
  registrar: (d: DatosTecnico) => api.post<{ tecnico: TecnicoDetalle; cuenta: CuentaMovil | null }>('/tecnicos', d),
  editar: (id: number, d: DatosTecnico) => api.put<TecnicoDetalle>(`/tecnicos/${id}`, d),
  crearCuenta: (id: number) => api.post<{ tecnico: TecnicoDetalle; cuenta: CuentaMovil }>(`/tecnicos/${id}/cuenta`),
  cambiarEstado: (id: number, estado: EstadoRegistro, confirmar?: boolean) => api.patch<TecnicoDetalle>(`/tecnicos/${id}/estado`, { estado, confirmar }),
}
