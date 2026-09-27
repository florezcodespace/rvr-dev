import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EVENTO_SESION_CADUCADA } from '@shared/lib/api'
import { authService } from '../api/authService'
import type { Cuenta } from '../api/tipos'

export type EstadoAuth = 'cargando' | 'autenticado' | 'anonimo'

export interface AuthContextValue {
  status: EstadoAuth
  usuario: Cuenta | null
  login: (usuario: string, contrasena: string, recordarme: boolean) => Promise<Cuenta>
  logout: () => Promise<void>
  /** Refresca la cuenta en pantalla tras cambiar sus propios datos. */
  actualizarUsuario: (usuario: Cuenta) => void
  /** ¿Tiene alguno de estos permisos? («modulo.nombre») */
  tiene: (...permisos: string[]) => boolean
  /** Mensaje cuando la sesión se cerró desde el servidor. */
  aviso: string | null
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<EstadoAuth>('cargando')
  const [usuario, setUsuario] = useState<Cuenta | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    authService
      .restaurar()
      .then((sesion) => {
        if (!activo) return
        setUsuario(sesion?.usuario ?? null)
        setStatus(sesion ? 'autenticado' : 'anonimo')
      })
      .catch(() => {
        if (!activo) return
        setUsuario(null)
        setStatus('anonimo')
      })
    return () => {
      activo = false
    }
  }, [])

  // CA_11_02 / CA_73_05 · si el servidor invalida la sesión, se sale de inmediato.
  useEffect(() => {
    const alCaducar = (evento: Event) => {
      const detalle = (evento as CustomEvent<string | undefined>).detail
      setAviso(detalle ?? 'Tu sesión se cerró. Ingresa de nuevo.')
      setUsuario(null)
      setStatus('anonimo')
      localStorage.removeItem('rvr.session')
    }
    window.addEventListener(EVENTO_SESION_CADUCADA, alCaducar)
    return () => window.removeEventListener(EVENTO_SESION_CADUCADA, alCaducar)
  }, [])

  const login = useCallback(async (u: string, c: string, recordarme: boolean) => {
    const sesion = await authService.login(u, c, recordarme)
    setAviso(null)
    setUsuario(sesion.usuario)
    setStatus('autenticado')
    return sesion.usuario
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUsuario(null)
    setStatus('anonimo')
  }, [])

  const actualizarUsuario = useCallback((actualizado: Cuenta) => {
    authService.guardarCuenta(actualizado)
    setUsuario(actualizado)
  }, [])

  const tiene = useCallback(
    (...permisos: string[]) => Boolean(usuario && permisos.some((p) => usuario.permisos.includes(p))),
    [usuario],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ status, usuario, login, logout, actualizarUsuario, tiene, aviso }),
    [status, usuario, login, logout, actualizarUsuario, tiene, aviso],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
