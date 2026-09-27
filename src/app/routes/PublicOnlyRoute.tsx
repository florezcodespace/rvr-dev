import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { PantallaCarga } from '@shared/components/marca/PantallaCarga'
import { rutaInicial } from '@app/layouts/navigation'

/** Evita que un usuario ya autenticado vuelva al login o al registro. */
export function PublicOnlyRoute() {
  const { status, usuario } = useAuth()
  if (status === 'cargando') return <PantallaCarga mensaje="Verificando tu sesión…" />
  if (status === 'autenticado') return <Navigate to={rutaInicial(usuario)} replace />
  return <Outlet />
}
