import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ROUTES } from './paths'

/** Evita que un usuario ya autenticado vuelva al login. */
export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'cargando') return null
  if (status === 'autenticado') return <Navigate to={ROUTES.dashboard} replace />

  return <Outlet />
}
