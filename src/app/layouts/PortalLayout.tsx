import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { PanelNotificaciones } from '@features/notificaciones'
import { InsigniaDemo } from '@app/demo/InsigniaDemo'
import { ROUTES } from '@app/routes/paths'
import { IconCarrito, IconCotizaciones, IconInicio, IconOrdenes, IconSalir, IconServicios, IconUsuarios } from '@shared/components/icons'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { Avatar } from '@shared/components/ui'
import { useCarrito } from '@shared/hooks/useCarrito'
import { cn } from '@shared/lib/cn'

const ENLACES = [
  { to: ROUTES.portal, label: 'Inicio', corto: 'Inicio', icon: IconInicio, fin: true },
  { to: ROUTES.portalCatalogo, label: 'Catálogo', corto: 'Catálogo', icon: IconServicios },
  { to: ROUTES.portalCotizaciones, label: 'Mis cotizaciones', corto: 'Cotizaciones', icon: IconCotizaciones },
  { to: ROUTES.portalOrdenes, label: 'Mis órdenes', corto: 'Órdenes', icon: IconOrdenes },
  { to: ROUTES.portalPerfil, label: 'Mi perfil', corto: 'Perfil', icon: IconUsuarios },
]

/**
 * Portal del cliente: navegación superior sencilla (en móvil, barra inferior),
 * el carrito de servicios por solicitar y los avisos de RvR.
 */
export function PortalLayout() {
  const { usuario, logout } = useAuth()
  const { unidades } = useCarrito()

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="no-imprimir superficie-superior sticky top-0 z-30 border-b border-border-base">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <Link to={ROUTES.portal} className="flex items-center gap-2.5 rounded-[11px] pr-2">
            <IconoMarca tamano={34} radio="27%" alt="" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13.5px] font-bold tracking-[-0.2px] text-fg">Portal del cliente</span>
              <span className="block text-[10.5px] text-fg-subtle">RvR Tecnologías</span>
            </span>
          </Link>

          <nav aria-label="Portal del cliente" className="ml-4 hidden items-center gap-1 lg:flex">
            {ENLACES.map((e) => (
              <NavLink
                key={e.to}
                to={e.to}
                end={e.fin}
                className={({ isActive }) =>
                  cn('rounded-[9px] px-3 py-2 text-[13px] font-semibold transition-colors',
                    isActive ? 'bg-primary-soft text-primary-on-soft' : 'text-fg-muted hover:bg-surface-muted hover:text-fg')
                }
              >
                {e.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <InsigniaDemo />
            <Link
              to={ROUTES.portalSolicitar}
              aria-label={unidades ? `Solicitud en curso: ${unidades} servicio(s)` : 'Solicitar servicios'}
              title="Mi solicitud"
              className="relative flex size-[34px] items-center justify-center rounded-[9px] border border-border-base text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              <IconCarrito />
              {unidades > 0 && (
                <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-surface bg-primary px-1 text-[9px] font-bold text-white">
                  {unidades}
                </span>
              )}
            </Link>
            <PanelNotificaciones />
            <Link to={ROUTES.portalPerfil} className="hidden items-center gap-2 rounded-[10px] px-1 py-0.5 hover:bg-surface-muted sm:flex">
              <Avatar nombre={usuario?.nombre ?? 'Cliente'} />
              <span className="hidden text-[12.5px] font-semibold text-fg md:block">{usuario?.nombres}</span>
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-border-base text-fg-muted transition-colors hover:bg-surface-muted hover:text-danger-fg"
            >
              <IconSalir />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 pb-28 sm:px-6 lg:pb-10">
        <Outlet />
      </main>

      <nav
        aria-label="Portal del cliente"
        className="no-imprimir fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-border-base bg-surface px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden"
      >
        {ENLACES.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            end={e.fin}
            className={({ isActive }) =>
              cn('flex min-h-12 flex-col items-center justify-center gap-1 rounded-[11px] text-[10px] font-semibold',
                isActive ? 'bg-primary-soft text-primary-on-soft' : 'text-fg-faint')
            }
          >
            <e.icon />
            {e.corto}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
