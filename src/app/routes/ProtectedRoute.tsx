import type { ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type TipoCuenta } from '@features/auth'
import { PantallaCarga } from '@shared/components/marca/PantallaCarga'
import { Button } from '@shared/components/ui'
import { rutaInicial } from '@app/layouts/navigation'
import { ROUTES } from './paths'

/**
 * Bloquea las rutas privadas (CA_14_03) y recuerda a dónde iba el usuario.
 * `tipo` separa los portales: un cliente no entra al administrativo ni al revés.
 */
export function ProtectedRoute({ tipo }: { tipo: TipoCuenta }) {
  const { status, usuario } = useAuth()
  const location = useLocation()

  if (status === 'cargando') return <PantallaCarga mensaje="Verificando tu sesión…" />
  if (status === 'anonimo' || !usuario) return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  if (usuario.tipo !== tipo) return <Navigate to={rutaInicial(usuario)} replace />

  return <Outlet />
}

/** Página sin permiso: el rol no tiene ninguno de los permisos del módulo. */
export function SinPermiso() {
  const { usuario } = useAuth()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-[16px] bg-warning-soft text-[24px] text-warning-fg" aria-hidden="true">⊘</div>
      <h1 className="m-0 text-[20px] font-bold text-fg">Tu rol no tiene acceso a este módulo</h1>
      <p className="m-0 max-w-[420px] text-[13px] text-fg-muted">
        Si necesitas entrar aquí, pídele al administrador que agregue el permiso al rol «{usuario?.rol.nombre}».
      </p>
      <Link to={rutaInicial(usuario)}><Button variant="secondary">Ir a mi inicio</Button></Link>
    </div>
  )
}

/** Envuelve una vista que exige alguno de los permisos indicados. */
export function ConPermiso({ permisos, children }: { permisos: string[]; children: ReactNode }) {
  const { tiene } = useAuth()
  return tiene(...permisos) ? <>{children}</> : <SinPermiso />
}
