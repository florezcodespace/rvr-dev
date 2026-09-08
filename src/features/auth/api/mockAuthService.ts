import { delay } from '@shared/lib/delay'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import type { AuthService } from './authService'
import { AuthError } from '../types'
import type { CredencialesLogin, Sesion, Usuario } from '../types'

/** Usuarios de prueba mientras no exista el backend. Contraseña: la indicada abajo. */
interface UsuarioMock extends Usuario {
  contrasena: string
}

const USUARIOS: UsuarioMock[] = [
  {
    id: 1,
    rol: { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al portal' },
    nombreUsuario: 'ricardo.vargas',
    correo: 'ricardo.vargas@rvrtec.co',
    estado: 'activo',
    ultimoAcceso: null,
    contrasena: 'RvR2026*admin',
  },
  {
    id: 2,
    rol: { id: 2, nombre: 'Técnico', descripcion: 'Órdenes asignadas y reportes' },
    nombreUsuario: 'julian.mora',
    correo: 'julian.mora@rvrtec.co',
    estado: 'activo',
    ultimoAcceso: null,
    contrasena: 'RvR2026*tecnico',
  },
  {
    id: 3,
    rol: { id: 3, nombre: 'Cliente', descripcion: 'Consulta de sus órdenes' },
    nombreUsuario: 'ana.suarez',
    correo: 'ana.suarez@clienteacme.co',
    estado: 'inactivo',
    ultimoAcceso: '2026-07-30T14:12:00.000Z',
    contrasena: 'RvR2026*cliente',
  },
]

const MAX_INTENTOS = 3
const DURACION_SESION_MS = 8 * 60 * 60 * 1000

/** Contador de intentos fallidos por correo (en memoria: se reinicia al recargar). */
const intentosFallidos = new Map<string, number>()

function construirSesion(usuario: UsuarioMock): Sesion {
  const { contrasena: _contrasena, ...datos } = usuario
  return {
    usuario: { ...datos, ultimoAcceso: new Date().toISOString() },
    token: `mock.${btoa(`${usuario.id}:${Date.now()}`)}`,
    expiraEn: new Date(Date.now() + DURACION_SESION_MS).toISOString(),
  }
}

export const mockAuthService: AuthService = {
  async login({ correo, contrasena, recordarme }: CredencialesLogin): Promise<Sesion> {
    await delay(700)

    const email = correo.trim().toLowerCase()
    const usuario = USUARIOS.find((u) => u.correo.toLowerCase() === email)
    const fallidos = intentosFallidos.get(email) ?? 0

    if (fallidos >= MAX_INTENTOS) {
      throw new AuthError(
        'CUENTA_BLOQUEADA',
        'Cuenta bloqueada temporalmente por intentos fallidos',
        0,
      )
    }

    if (!usuario || usuario.contrasena !== contrasena) {
      const restantes = MAX_INTENTOS - (fallidos + 1)
      intentosFallidos.set(email, fallidos + 1)
      throw new AuthError(
        'CREDENCIALES_INVALIDAS',
        'Correo o contraseña incorrectos',
        Math.max(restantes, 0),
      )
    }

    if (usuario.estado === 'inactivo') {
      throw new AuthError(
        'USUARIO_INACTIVO',
        'La cuenta está inactiva. Contacta al administrador del portal.',
      )
    }

    intentosFallidos.delete(email)

    const sesion = construirSesion(usuario)
    storage.set(STORAGE_KEYS.session, sesion)

    if (recordarme) {
      storage.set(STORAGE_KEYS.rememberedEmail, usuario.correo)
    } else {
      storage.remove(STORAGE_KEYS.rememberedEmail)
    }

    // Equivalente al insert en `log_accesos` que hará el backend real.
    console.info('[log_accesos] inicio_sesion', {
      usuario_id: sesion.usuario.id,
      fecha_hora: sesion.usuario.ultimoAcceso,
    })

    return sesion
  },

  async logout(): Promise<void> {
    await delay(200)
    storage.remove(STORAGE_KEYS.session)
  },

  async restaurarSesion(): Promise<Sesion | null> {
    const sesion = storage.get<Sesion | null>(STORAGE_KEYS.session, null)
    if (!sesion) return null

    if (new Date(sesion.expiraEn).getTime() <= Date.now()) {
      storage.remove(STORAGE_KEYS.session)
      return null
    }

    return sesion
  },

  async perfilActual(): Promise<Usuario | null> {
    const sesion = await this.restaurarSesion()
    return sesion?.usuario ?? null
  },
}

/** Credenciales visibles en la pantalla de login mientras estemos en modo mock. */
export const CREDENCIALES_DEMO = USUARIOS.filter((u) => u.estado === 'activo').map(
  (u) => ({ correo: u.correo, contrasena: u.contrasena, rol: u.rol.nombre }),
)
