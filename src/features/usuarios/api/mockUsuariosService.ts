import type { EstadoUsuario, RolUsuario } from '@shared/domain/estados'
import { delay } from '@shared/lib/delay'
import { paginar } from '@shared/lib/paginar'
import type { UsuariosService } from './usuariosService'
import type {
  ListadoUsuarios,
  ParamsUsuarios,
  TabUsuario,
  UsuarioPortal,
} from '../types'

const SEMILLA: Array<[string, RolUsuario, EstadoUsuario, string | null]> = [
  ['Ricardo Vargas', 'administrador', 'activo', '2026-09-08T08:12:00'],
  ['Laura Betancur', 'coordinacion', 'activo', '2026-09-08T07:45:00'],
  ['Carlos Ramírez', 'tecnico', 'activo', '2026-09-07T18:30:00'],
  ['Ana Torres', 'tecnico', 'activo', '2026-09-07T17:02:00'],
  ['Diego Naranjo', 'facturacion', 'activo', '2026-09-03T09:20:00'],
  ['Paola Restrepo', 'soporte', 'invitacion_enviada', null],
  ['Jorge Mesa', 'tecnico', 'inactivo', '2026-07-12T11:40:00'],
]

const NOMBRES_EXTRA = [
  'Sofía Marín',
  'Luis Morales',
  'María Gómez',
  'Julián Vélez',
  'Andrés Loaiza',
  'Valentina Ruiz',
  'Camila Ospina',
  'Felipe Zapata',
  'Natalia Cano',
  'Sebastián Arango',
  'Daniela Uribe',
  'Mateo Jaramillo',
  'Isabel Correa',
  'Tomás Bedoya',
  'Lucía Henao',
  'Samuel Duque',
  'Manuela Ríos'
]

const ROLES_EXTRA: RolUsuario[] = ['tecnico', 'tecnico', 'soporte', 'coordinacion', 'tecnico']

function correoDe(nombre: string): string {
  return `${nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')}@rvr.co`
}

function construir(): UsuarioPortal[] {
  const lista: UsuarioPortal[] = SEMILLA.map(([nombre, rol, estado, ultimoAcceso], i) => ({
    id: i + 1,
    nombre,
    correo: correoDe(nombre),
    rol,
    estado,
    ultimoAcceso,
  }))

  NOMBRES_EXTRA.forEach((nombre, i) => {
    const fecha = new Date(2026, 8, 6)
    fecha.setDate(fecha.getDate() - i * 3)
    lista.push({
      id: 100 + i,
      nombre,
      correo: correoDe(nombre),
      rol: ROLES_EXTRA[i % ROLES_EXTRA.length]!,
      estado: i % 8 === 3 ? 'inactivo' : 'activo',
      ultimoAcceso: fecha.toISOString(),
    })
  })

  return lista
}

const USUARIOS = construir()

const POR_TAB: Record<TabUsuario, (u: UsuarioPortal) => boolean> = {
  todos: () => true,
  administradores: (u) => u.rol === 'administrador',
  coordinacion: (u) => u.rol === 'coordinacion',
  tecnicos: (u) => u.rol === 'tecnico',
  inactivos: (u) => u.estado === 'inactivo' || u.estado === 'bloqueado',
}

const HACE_30_DIAS = new Date(2026, 7, 9).toISOString()

export const mockUsuariosService: UsuariosService = {
  async listar({ tab, q, pagina }: ParamsUsuarios): Promise<ListadoUsuarios> {
    await delay(300)

    const texto = q.trim().toLowerCase()
    const filtrados = USUARIOS.filter(
      (u) =>
        POR_TAB[tab](u) &&
        (!texto || `${u.nombre} ${u.correo}`.toLowerCase().includes(texto)),
    )

    return {
      pagina: paginar(filtrados, pagina),
      resumen: {
        activos: USUARIOS.filter((u) => u.estado === 'activo').length,
        total: USUARIOS.length,
        administradores: USUARIOS.filter((u) => u.rol === 'administrador').length,
        invitaciones: USUARIOS.filter((u) => u.estado === 'invitacion_enviada').length,
        sinIngresar30: USUARIOS.filter(
          (u) => u.ultimoAcceso !== null && u.ultimoAcceso < HACE_30_DIAS,
        ).length,
      },
      conteos: {
        todos: USUARIOS.length,
        administradores: USUARIOS.filter(POR_TAB.administradores).length,
        coordinacion: USUARIOS.filter(POR_TAB.coordinacion).length,
        tecnicos: USUARIOS.filter(POR_TAB.tecnicos).length,
        inactivos: USUARIOS.filter(POR_TAB.inactivos).length,
      },
    }
  },

  async cambiarEstado(id: number, estado: EstadoUsuario): Promise<void> {
    await delay(180)
    const usuario = USUARIOS.find((u) => u.id === id)
    if (usuario) usuario.estado = estado
  },

  async cambiarRol(id: number, rol: RolUsuario): Promise<void> {
    await delay(180)
    const usuario = USUARIOS.find((u) => u.id === id)
    if (usuario) usuario.rol = rol
  },
}
