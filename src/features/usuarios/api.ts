import { api, type Conteos, type Pagina } from '@shared/lib/api'
import type { EstadoRegistro, ResultadoAcceso } from '@shared/domain/estados'

export interface Usuario {
  id: number
  nombreUsuario: string
  nombres: string
  apellidos: string
  nombre: string
  correo: string
  telefono: string
  estado: EstadoRegistro
  rol: { id: number; nombre: string; estado: EstadoRegistro }
  vinculo: { tipo: 'cliente' | 'tecnico'; id: number } | null
  ultimoAcceso: string | null
}

export interface UsuarioDetalle extends Usuario {
  permisosPorModulo: { modulo: string; nombre: string; permisos: { id: number; nombre: string; modulo: string; descripcion: string }[] }[]
  ultimosAccesos: { id: number; resultado: ResultadoAcceso; canal: string; ip: string | null; fecha: string }[]
}

export interface DatosUsuario {
  nombreUsuario: string
  correo: string
  nombres: string
  apellidos: string
  telefono: string | null
  rolId: number
}

export interface Acceso {
  id: number
  usuarioId: number | null
  identificador: string
  nombre: string | null
  rol: string | null
  resultado: ResultadoAcceso
  canal: 'web' | 'movil'
  ip: string
  fecha: string
}

export const usuariosService = {
  listar: (p: { q: string; pagina: number; estado: string; rol: string }) => api.get<Pagina<Usuario> & { conteos: Conteos }>('/usuarios', p),
  detalle: (id: number) => api.get<UsuarioDetalle>(`/usuarios/${id}`),
  roles: () => api.get<{ id: number; nombre: string; estado: EstadoRegistro }[]>('/roles/opciones'),
  registrar: (d: DatosUsuario) => api.post<{ usuario: UsuarioDetalle; contrasenaTemporal: string }>('/usuarios', d),
  editar: (id: number, d: DatosUsuario) => api.put<UsuarioDetalle>(`/usuarios/${id}`, d),
  cambiarEstado: (id: number, estado: EstadoRegistro) => api.patch<UsuarioDetalle>(`/usuarios/${id}/estado`, { estado }),
  restablecer: (id: number) => api.post<{ contrasenaTemporal: string }>(`/usuarios/${id}/contrasena`),
  accesos: (p: { q: string; pagina: number; resultado: string; canal: string; desde: string; hasta: string }) =>
    api.get<Pagina<Acceso> & { resumen7Dias: { exitosos: number; fallidos: number; bloqueos: number } }>('/accesos', { ...p, porPagina: 20 }),
}
