import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoCotizacion, EstadoOrden, EstadoRegistro } from '@shared/domain/estados'

export interface Cliente {
  id: number
  tipoDocumento: string
  documento: string
  nombres: string
  apellidos: string
  nombre: string
  telefono: string
  direccion: string
  correo: string
  fechaRegistro: string
  estado: EstadoRegistro
  tieneCuenta: boolean
  cotizaciones: number
  ordenes: number
  ordenesEnCurso: number
}

export interface ClienteDetalle extends Cliente {
  cartera: { facturado: number; abonado: number; saldo: number }
  historialCotizaciones: { id: number; numero: string; fecha: string; estado: EstadoCotizacion; montoTotal: number; origen: string; orden: { id: number; codigo: string } | null }[]
  historialOrdenes: { id: number; codigo: string; fecha: string; estado: EstadoOrden; monto: number | null; saldo: number | null }[]
}

export interface DatosCliente {
  tipoDocumento: string
  documento: string
  nombres: string
  apellidos: string
  telefono: string | null
  direccion: string | null
  correo: string | null
  crearAcceso?: boolean
}

/** Cuenta del portal recién creada: la contraseña temporal se ve una sola vez. */
export interface AccesoNuevo {
  usuarioId: number
  nombreUsuario: string
  contrasenaTemporal: string
}

export const clientesService = {
  listar: (p: { q: string; pagina: number; estado: string; orden: string }) => api.get<Pagina<Cliente> & { conteos: Conteos }>('/clientes', p),
  detalle: (id: number) => api.get<ClienteDetalle>(`/clientes/${id}`),
  registrar: (d: DatosCliente) => api.post<ClienteDetalle & { acceso: AccesoNuevo | null }>('/clientes', d),
  darAcceso: (id: number) => api.post<ClienteDetalle & { acceso: AccesoNuevo }>(`/clientes/${id}/acceso`),
  disponible: (campo: 'documento' | 'correo', valor: string, excepto = 0) =>
    api.get<{ disponible: boolean; cliente?: { id: number; nombre: string; conCuenta: boolean } }>('/clientes/disponible', { campo, valor, excepto }),
  editar: (id: number, d: DatosCliente) => api.put<ClienteDetalle>(`/clientes/${id}`, d),
  cambiarEstado: (id: number, estado: EstadoRegistro, confirmar?: boolean) => api.patch<ClienteDetalle>(`/clientes/${id}/estado`, { estado, confirmar }),
}
