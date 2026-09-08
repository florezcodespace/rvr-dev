import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { useAuth } from './useAuth'
import { AuthError } from '../types'
import type { LoginFormValues } from '../schemas/loginSchema'

export interface LoginErrorState {
  title: string
  description?: string
}

/** Orquesta el envío del formulario: llama al servicio, traduce errores y redirige. */
export function useLogin(redirectTo: string = ROUTES.dashboard) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<LoginErrorState | null>(null)
  const [enviando, setEnviando] = useState(false)

  const limpiarError = useCallback(() => setError(null), [])

  const enviar = useCallback(
    async (values: LoginFormValues) => {
      setEnviando(true)
      setError(null)

      try {
        await login({
          correo: values.correo,
          contrasena: values.contrasena,
          recordarme: values.recordarme,
        })
        navigate(redirectTo, { replace: true })
      } catch (err) {
        if (err instanceof AuthError) {
          setError({
            title: err.message,
            description:
              err.code === 'CREDENCIALES_INVALIDAS' && err.intentosRestantes !== undefined
                ? err.intentosRestantes > 0
                  ? `Te ${err.intentosRestantes === 1 ? 'queda 1 intento' : `quedan ${err.intentosRestantes} intentos`} antes del bloqueo temporal.`
                  : 'Este fue el último intento disponible.'
                : err.code === 'CUENTA_BLOQUEADA'
                  ? 'Espera unos minutos o solicita el desbloqueo al administrador.'
                  : err.code === 'USUARIO_INACTIVO'
                    ? 'Escribe a soporte@rvrtec.co para reactivarla.'
                    : undefined,
          })
        } else {
          setError({
            title: 'No pudimos conectar con el servidor',
            description: 'Revisa tu conexión e inténtalo de nuevo.',
          })
        }
      } finally {
        setEnviando(false)
      }
    },
    [login, navigate, redirectTo],
  )

  return { enviar, error, enviando, limpiarError }
}
