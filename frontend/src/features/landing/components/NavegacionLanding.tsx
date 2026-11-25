import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { cn } from '@shared/lib/cn'
import { IcoFlecha } from './iconos'

const ENLACES = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#portal', label: 'Su portal' },
  { href: '#proceso', label: 'Cómo trabajamos' },
  { href: '#cotizador', label: 'Cotizador' },
  { href: '#contacto', label: 'Contacto' },
]

/**
 * Barra flotante de vidrio esmerilado. Al bajar se encoge. El enlace
 * de la sección visible queda marcado.
 */
export function NavegacionLanding() {
  const [abierto, setAbierto] = useState(false)
  const [posada, setPosada] = useState(false)
  const [activa, setActiva] = useState('')
  const barra = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const alDesplazar = () => {
      setPosada(window.scrollY > 16)
      const total = document.documentElement.scrollHeight - window.innerHeight
      barra.current?.style.setProperty('--progreso', String(total > 0 ? Math.min(1, window.scrollY / total) : 0))
    }
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  // Sección visible → enlace marcado.
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return
    const secciones = ENLACES.map((e) => document.querySelector(e.href)).filter((s): s is Element => !!s)
    const obs = new IntersectionObserver(
      (entradas) => {
        const visible = entradas.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiva(`#${visible.target.id}`)
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    )
    secciones.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

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
    <header className="landing-nav sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={cn(
          'nav-cristal relative mx-auto flex h-[64px] items-center justify-between gap-3 rounded-[22px] border px-3 transition-[max-width,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-4',
          posada || abierto ? 'max-w-[1120px]' : 'max-w-[1200px]',
        )}
      >
        {/* Progreso de lectura de la página */}
        <span aria-hidden="true" className={cn('pointer-events-none absolute inset-x-5 -bottom-px h-[2px] overflow-hidden rounded-full transition-opacity duration-300', posada ? 'opacity-100' : 'opacity-0')}>
          <span ref={barra} className="progreso-lectura block h-full rounded-full bg-primary" />
        </span>
        <a href="#inicio" onClick={cerrar} className="flex items-center gap-2.5 rounded-[14px] pr-2">
          <IconoMarca tamano={38} radio="28%" alt="" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-bold tracking-[-0.3px] text-fg">RvR Tecnologías</span>
            <span className="block text-[12px] font-medium text-fg-subtle">Soluciones a su alcance</span>
          </span>
        </a>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Secciones">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className={cn(
                'rounded-[12px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
                activa === enlace.href ? 'bg-primary-soft text-primary-on-soft' : 'text-fg-muted hover:bg-primary-soft hover:text-fg',
              )}
            >
              {enlace.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.catalogo}
            className="hidden rounded-[12px] px-3.5 py-2 text-[13.5px] font-semibold text-primary-on-soft transition-colors hover:bg-primary-soft xl:inline-flex"
          >
            Catálogo
          </Link>
          <Link
            to={ROUTES.login}
            className="pintura-boton boton-liquido hidden h-[42px] items-center gap-2 rounded-[14px] px-4.5 text-[13.5px] font-semibold text-on-primary sm:inline-flex"
          >
            Ingresar al portal
            <IcoFlecha width="15" height="15" />
          </Link>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-landing"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[14px] border border-border-base bg-surface text-fg transition-colors hover:bg-surface-raised lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
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
        <div id="menu-landing" className="vidrio-denso anim-entrada mx-auto mt-2 max-w-[1120px] rounded-[22px] border border-[var(--rvr-glass-borde)] p-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Secciones">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                onClick={cerrar}
                className="rounded-[14px] px-3.5 py-3 text-[15px] font-semibold text-fg-muted transition-colors hover:bg-primary-soft hover:text-fg"
              >
                {enlace.label}
              </a>
            ))}
            <Link to={ROUTES.catalogo} onClick={cerrar} className="rounded-[14px] px-3.5 py-3 text-[15px] font-semibold text-primary-on-soft hover:bg-primary-soft">
              Catálogo de servicios
            </Link>
            <Link to={ROUTES.registro} onClick={cerrar} className="rounded-[14px] px-3.5 py-3 text-[15px] font-semibold text-fg-muted hover:bg-primary-soft hover:text-fg">
              Crear mi cuenta
            </Link>
          </nav>
          <Link
            to={ROUTES.login}
            onClick={cerrar}
            className="pintura-boton boton-liquido mt-2 flex h-12 items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-semibold text-on-primary"
          >
            Ingresar al portal
            <IcoFlecha width="15" height="15" />
          </Link>
        </div>
      )}
    </header>
  )
}
