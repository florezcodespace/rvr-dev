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
    <div className="flex min-h-dvh flex-col text-fg">
      <header className="no-imprimir sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="vidrio mx-auto flex h-16 max-w-[1180px] items-center gap-3 rounded-[22px] border border-[var(--rvr-glass-borde)] px-3 sm:px-4">
          <Link to={ROUTES.portal} className="flex items-center gap-2.5 rounded-[14px] pr-2">
            <IconoMarca tamano={34} radio="27%" alt="" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13.5px] font-semibold tracking-[-0.2px] text-fg">Portal del cliente</span>
              <span className="block text-[12px] text-fg-subtle">RvR Tecnologías</span>
            </span>
          </Link>

          <nav aria-label="Portal del cliente" className="ml-4 hidden items-center gap-1 lg:flex">
            {ENLACES.map((e) => (
              <NavLink
                key={e.to}
                to={e.to}
                end={e.fin}
                className={({ isActive }) =>
                  cn('flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] font-semibold transition-colors [&_svg]:size-4',
                    isActive ? 'bg-primary text-white shadow-[0_6px_16px_-8px_var(--rvr-halo-primary)]' : 'text-fg-muted hover:bg-primary-soft hover:text-fg')
                }
              >
                <e.icon />
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
              className={cn('relative flex size-[34px] items-center justify-center rounded-[10px] border transition-colors',
                unidades ? 'border-transparent bg-primary text-white shadow-[0_6px_16px_-8px_var(--rvr-halo-primary)]' : 'border-border-base text-fg-muted hover:bg-surface-muted hover:text-fg')}
            >
              <IconCarrito />
              {unidades > 0 && (
                <span key={unidades} className="portal-pop absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--rvr-surface-solid)] bg-[#f59e0b] px-1 text-[11px] font-bold text-white">
                  {unidades}
                </span>
              )}
            </Link>
            <PanelNotificaciones />
            <Link to={ROUTES.portalPerfil} className="hidden items-center gap-2 rounded-[10px] px-1 py-0.5 hover:bg-surface-muted sm:flex">
              <Avatar nombre={usuario?.nombre ?? 'Cliente'} />
              <span className="hidden text-[13px] font-semibold text-fg md:block">{usuario?.nombres}</span>
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-[34px] cursor-pointer items-center justify-center rounded-[10px] border border-border-base text-fg-muted transition-colors hover:bg-surface-muted hover:text-danger-fg"
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
        className="no-imprimir vidrio-denso fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-30 grid grid-cols-5 gap-1 rounded-[24px] border border-[var(--rvr-glass-borde)] p-1.5 lg:hidden"
      >
        {ENLACES.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            end={e.fin}
            className={({ isActive }) =>
              cn('flex min-h-12 flex-col items-center justify-center gap-1 rounded-[14px] text-[12px] font-semibold',
                isActive ? 'bg-primary text-white' : 'text-fg-faint')
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
