import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../api'
import type { CredencialesLogin, Usuario } from '../types'

export type AuthStatus = 'cargando' | 'autenticado' | 'anonimo'

export interface AuthContextValue {
  status: AuthStatus
  usuario: Usuario | null
  login: (credenciales: CredencialesLogin) => Promise<Usuario>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('cargando')
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  // Rehidrata la sesión al montar (evita pedir login en cada recarga).
  useEffect(() => {
    let activo = true

    authService
      .restaurarSesion()
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

  const login = useCallback(async (credenciales: CredencialesLogin) => {
    const sesion = await authService.login(credenciales)
    setUsuario(sesion.usuario)
    setStatus('autenticado')
    return sesion.usuario
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUsuario(null)
    setStatus('anonimo')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, usuario, login, logout }),
    [status, usuario, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
