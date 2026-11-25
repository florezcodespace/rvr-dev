import { useRef, useState } from 'react'
import { useClickAfuera } from '@shared/hooks/useClickAfuera'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { PanelNotificaciones } from '@features/notificaciones'
import { InsigniaDemo } from '@app/demo/InsigniaDemo'
import { ROUTES } from '@app/routes/paths'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { useCarrito } from '@shared/hooks/useCarrito'
import { cn } from '@shared/lib/cn'

const ENLACES = [
  { to: ROUTES.portal, label: 'Inicio', fin: true },
  { to: ROUTES.portalCatalogo, label: 'Catálogo' },
  { to: ROUTES.portalCotizaciones, label: 'Cotizaciones' },
  { to: ROUTES.portalOrdenes, label: 'Órdenes' },
  { to: ROUTES.portalPerfil, label: 'Perfil' },
]

/**
 * Portal del cliente: navegación superior adaptable,
 * el carrito de servicios por solicitar y los avisos de RvR.
 */
export function PortalLayout() {
  const { key } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col text-fg">
      <BarraPortal key={key} />
      <main className="w-full min-w-0 flex-1 px-4 py-5 sm:px-6 lg:py-7 xl:px-9">
        <Outlet />
      </main>
    </div>
  )
}

function BarraPortal() {
  const { logout } = useAuth()
  const { unidades } = useCarrito()
  const [abierto, setAbierto] = useState(false)
  const header = useRef<HTMLElement>(null)
  const botonMenu = useRef<HTMLButtonElement>(null)
  useClickAfuera(header, () => setAbierto(false), abierto)
  const enlaces = ENLACES.map((e) => (
    <NavLink key={e.to} to={e.to} end={e.fin} onClick={() => setAbierto(false)} className={({ isActive }) =>
      cn('rounded-[12px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
        isActive ? 'bg-primary-soft text-primary-on-soft' : 'text-fg-muted hover:bg-primary-soft hover:text-fg')
    }>{e.label}</NavLink>
  ))
  return (
    <header ref={header} className="no-imprimir sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4" onKeyDown={(e) => {
      if (abierto && e.key === 'Escape') { setAbierto(false); botonMenu.current?.focus() }
    }}>
      <div className="nav-cristal relative mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-2 rounded-[22px] border px-3 sm:px-4">
        <Link to={ROUTES.portal} aria-label="Inicio del portal RvR" className="flex items-center gap-2.5 rounded-[14px]">
          <IconoMarca tamano={38} radio="28%" alt="" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-bold tracking-[-0.3px]">RvR Tecnologías</span>
            <span className="block text-xs font-medium text-fg-subtle">Soluciones a su alcance</span>
          </span>
        </Link>
        <nav aria-label="Portal del cliente" className="hidden items-center gap-0.5 lg:flex">{enlaces}</nav>
        <div className="flex items-center gap-2 text-[13.5px] font-semibold">
          <InsigniaDemo className="hidden xl:inline-flex" />
          <PanelNotificaciones textual />
          <button onClick={() => void logout()} className="hidden cursor-pointer rounded-xl px-2 py-2 text-fg-muted hover:bg-primary-soft lg:block">Salir</button>
          <Link to={ROUTES.portalSolicitar} className="pintura-boton boton-liquido inline-flex h-[42px] items-center rounded-[14px] px-3 text-on-primary sm:px-4">
            Mi solicitud{unidades > 0 && ` (${unidades})`}
          </Link>
          <button ref={botonMenu} type="button" aria-expanded={abierto} aria-controls="menu-portal" onClick={() => setAbierto(!abierto)}
            className="h-11 rounded-[14px] border border-border-base bg-surface px-3 lg:hidden">{abierto ? 'Cerrar' : 'Menú'}</button>
        </div>
      </div>
      {abierto && <nav id="menu-portal" aria-label="Portal del cliente" className="nav-cristal absolute inset-x-3 top-full mt-2 grid gap-1 rounded-[22px] border p-3 lg:hidden">
        {enlaces}
        <div className="flex items-center justify-between border-t border-border-base px-3 pt-2">
          <InsigniaDemo /><button onClick={() => void logout()} className="py-2 text-sm font-semibold text-fg-muted">Cerrar sesión</button>
        </div>
      </nav>}
    </header>
  )
}
