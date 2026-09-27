import { api, ErrorApi, pedir } from '@shared/lib/api'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import type { Cuenta, DatosRegistro, Sesion } from './tipos'

/**
 * Gestión de Acceso (HU_13, HU_14, HU_72, HU_73) y Autogestión de la cuenta
 * (HU_75). La sesión vive en localStorage; al cerrar sesión se borra (CA_14_02).
 */
export const authService = {
  async login(usuario: string, contrasena: string, recordarme: boolean): Promise<Sesion> {
    const sesion = await pedir<Sesion>('/auth/login', {
      metodo: 'POST',
      cuerpo: { usuario, contrasena, canal: 'web' },
      sinSesion: true,
    })
    storage.set(STORAGE_KEYS.session, sesion)
    if (recordarme) storage.set(STORAGE_KEYS.rememberedEmail, usuario)
    else storage.remove(STORAGE_KEYS.rememberedEmail)
    return sesion
  },

  async logout(): Promise<void> {
    // Se avisa a la API para el registro de accesos; si falla, igual se cierra.
    try {
      await pedir<void>('/auth/logout', { metodo: 'POST', cuerpo: {} })
    } catch {
      /* sin red: la sesión local se borra de todos modos */
    }
    storage.remove(STORAGE_KEYS.session)
  },

  /** Rehidrata la sesión guardada y la confirma contra el servidor. */
  async restaurar(): Promise<Sesion | null> {
    const sesion = storage.get<Sesion | null>(STORAGE_KEYS.session, null)
    if (!sesion?.token || !sesion.usuario?.permisos) {
      storage.remove(STORAGE_KEYS.session)
      return null
    }
    if (new Date(sesion.expiraEn).getTime() <= Date.now()) {
      storage.remove(STORAGE_KEYS.session)
      return null
    }
    try {
      // La cuenta pudo inactivarse o cambiar de rol y permisos desde que se
      // guardó el token: el portal no confía en la copia local.
      const usuario = await api.get<Cuenta>('/auth/perfil')
      const confirmada = { ...sesion, usuario }
      storage.set(STORAGE_KEYS.session, confirmada)
      return confirmada
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 401) {
        storage.remove(STORAGE_KEYS.session)
        return null
      }
      // Sin conexión se conserva la sesión local.
      return sesion
    }
  },

  guardarCuenta(usuario: Cuenta) {
    const sesion = storage.get<Sesion | null>(STORAGE_KEYS.session, null)
    if (sesion) storage.set(STORAGE_KEYS.session, { ...sesion, usuario })
  },

  registrar: (datos: DatosRegistro) =>
    pedir<{ mensaje: string; vinculado: boolean; nombreUsuario: string }>('/auth/registro', { metodo: 'POST', cuerpo: datos, sinSesion: true }),

  recuperar: (correo: string) =>
    pedir<{ mensaje: string; enlaceDesarrollo?: string }>('/auth/recuperar', { metodo: 'POST', cuerpo: { correo }, sinSesion: true }),

  validarEnlace: (token: string) =>
    pedir<{ valido: boolean; correo: string }>(`/auth/restablecer/${token}`, { sinSesion: true }),

  restablecer: (token: string, nueva: string, confirmacion: string) =>
    pedir<{ mensaje: string }>('/auth/restablecer', { metodo: 'POST', cuerpo: { token, nueva, confirmacion }, sinSesion: true }),

  actualizarPerfil: (datos: { nombres: string; apellidos: string; correo: string; telefono: string | null }) =>
    api.put<Cuenta>('/auth/perfil', datos),

  cambiarContrasena: (actual: string, nueva: string, confirmacion: string) =>
    api.post<void>('/auth/contrasena', { actual, nueva, confirmacion }),
}
