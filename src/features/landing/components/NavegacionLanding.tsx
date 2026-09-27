import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { cn } from '@shared/lib/cn'
import { IcoFlecha } from './iconos'

const ENLACES = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#portafolio', label: 'Portafolio' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#contacto', label: 'Contacto' },
]

/**
 * Barra de la landing: una isla flotante, no una banda pegada al borde.
 *
 * Arranca transparente sobre el hero y al bajar se posa —gana fondo, borde y
 * sombra— para que el contenido no la atraviese. El menú de móvil es una hoja
 * debajo de la misma isla, con su mismo redondeo.
 */
export function NavegacionLanding() {
  const [abierto, setAbierto] = useState(false)
  const [posada, setPosada] = useState(false)

  useEffect(() => {
    const alDesplazar = () => setPosada(window.scrollY > 16)
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  // Con el menú abierto el fondo no debe desplazarse por detrás de la hoja.
  useEffect(() => {
    if (!abierto) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [abierto])

  const cerrar = () => setAbierto(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 px-4 pt-3 pb-3 transition-opacity duration-300 sm:px-6 sm:pt-4',
        (posada || abierto) && 'velo-superior backdrop-blur-[3px]',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-[62px] max-w-[1120px] items-center justify-between gap-3 rounded-[16px] border px-3 transition-[background-color,border-color,box-shadow,max-width] duration-300 motion-reduce:transition-none',
          posada || abierto
            ? 'border-border-base bg-surface/85 shadow-[var(--rvr-shadow-card)] backdrop-blur-xl'
            : 'max-w-[1160px] border-transparent bg-transparent',
        )}
      >
        <a
          href="#inicio"
          onClick={cerrar}
          className="flex items-center gap-2.5 rounded-[11px] pr-2"
        >
          <IconoMarca tamano={36} radio="27%" alt="" />
          <span className="hidden leading-tight sm:block">
            <span className="block font-[family-name:var(--font-display)] text-[15px] font-bold tracking-[-0.2px] text-fg">
              RvR Tecnologías
            </span>
            <span className="block text-[11px] text-fg-subtle">
              Soluciones a su alcance
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="rounded-[9px] px-3 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              {enlace.label}
            </a>
          ))}
          <Link
            to={ROUTES.catalogo}
            className="rounded-[9px] px-3 py-2 text-[13px] font-semibold text-primary-on-soft transition-colors hover:bg-surface-muted"
          >
            Catálogo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.login}
            className="pintura-boton pintura-primaria hidden h-[40px] items-center gap-2 rounded-[11px] px-4 text-[12.5px] font-semibold text-on-primary sm:inline-flex"
          >
            Ingresar al portal
            <IcoFlecha width="14" height="14" />
          </Link>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-landing"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[11px] border border-border-base text-fg transition-colors hover:bg-surface-muted lg:hidden"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {abierto ? (
                <>
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </>
              ) : (
                <>
                  <line x1="2.5" y1="5" x2="13.5" y2="5" />
                  <line x1="2.5" y1="11" x2="13.5" y2="11" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {abierto && (
        <div
          id="menu-landing"
          className="anim-entrada mx-auto mt-2 max-w-[1120px] rounded-[16px] border border-border-base bg-surface p-3 shadow-[var(--rvr-shadow-card-up)] lg:hidden"
        >
          <nav className="flex flex-col" aria-label="Secciones">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                onClick={cerrar}
                className="rounded-[10px] px-3 py-3 text-[14px] font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
              >
                {enlace.label}
              </a>
            ))}
            <Link
              to={ROUTES.catalogo}
              onClick={cerrar}
              className="rounded-[10px] px-3 py-3 text-[14px] font-semibold text-primary-on-soft transition-colors hover:bg-surface-muted"
            >
              Catálogo de servicios
            </Link>
            <Link
              to={ROUTES.registro}
              onClick={cerrar}
              className="rounded-[10px] px-3 py-3 text-[14px] font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              Crear mi cuenta
            </Link>
          </nav>
          <Link
            to={ROUTES.login}
            onClick={cerrar}
            className="pintura-boton pintura-primaria mt-2 flex h-[44px] items-center justify-center gap-2 rounded-[11px] text-[13px] font-semibold text-on-primary"
          >
            Ingresar al portal
            <IcoFlecha width="14" height="14" />
          </Link>
        </div>
      )}
    </header>
  )
}
