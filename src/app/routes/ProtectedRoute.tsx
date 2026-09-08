import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { Spinner } from '@shared/components/ui'
import { ROUTES } from './paths'

/** Bloquea las rutas privadas y recuerda a dónde iba el usuario. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'cargando') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-fg-subtle">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (status === 'anonimo') {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
