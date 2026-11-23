import { hayCarrito } from '@shared/hooks/useCarrito'
import { ROUTES } from './paths'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { PantallaCarga } from '@shared/components/marca/PantallaCarga'
import { rutaInicial } from '@app/layouts/navigation'

/** Evita que un usuario ya autenticado vuelva al login o al registro. */
export function PublicOnlyRoute() {
  const { status, usuario } = useAuth()
  const location = useLocation()
  if (status === 'cargando') return <PantallaCarga mensaje="Verificando tu sesión…" />
  if (status === 'autenticado') {
    const desde = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    let destino = rutaInicial(usuario)
    if (usuario?.tipo === 'cliente' && hayCarrito()) destino = ROUTES.portalSolicitar
    else if (desde && desde.startsWith('/') && !desde.startsWith('//') && desde.startsWith('/portal') === (usuario?.tipo === 'cliente')) destino = desde
    return <Navigate to={destino} replace />
  }
  return <Outlet />
}
