import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ROUTES } from '@app/routes/paths'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { Avatar } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import { nombreLegible } from '@shared/lib/format'
import { menuDe, rutaInicial } from '../navigation'
import { useSeccionesMenu } from '../useSidebar'

/** Flecha de una sección del menú: abajo abierta, a la derecha plegada. */
function IconSeccion({ abierta }: { abierta: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('transition-transform duration-200 motion-reduce:transition-none', !abierta && '-rotate-90')}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

/** Chevron del pliegue: apunta hacia donde va a moverse el panel. */
function IconPliegue({ colapsado }: { colapsado: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('transition-transform duration-200', colapsado && 'rotate-180')}
    >
      <rect x="2" y="2.5" width="12" height="11" rx="2" />
      <line x1="6.5" y1="2.5" x2="6.5" y2="13.5" />
    </svg>
  )
}

/** Enlace de salida al sitio público: flecha que sale de una caja. */
function IconSitio() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 2.5H3a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 3 14.5h9a1.5 1.5 0 0 0 1.5-1.5V7.5" />
      <path d="M10 2h4v4" />
      <line x1="7" y1="9" x2="14" y2="2" />
    </svg>
  )
}

/**
 * Navegación lateral. Un solo componente para los dos estados: plegado es el
 * mismo panel a 76 px, no una pieza distinta, así la transición de ancho es
 * continua y no hay dos árboles que mantener sincronizados.
 */
export function Sidebar({
  colapsado,
  puedeAlternar,
  onAlternar,
  className,
}: {
  colapsado: boolean
  puedeAlternar: boolean
  onAlternar: () => void
  className?: string
}) {
  const { usuario } = useAuth()
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  const grupos = menuDe(usuario)
  const seccionActual = grupos.find((g) =>
    g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`)),
  )?.titulo ?? null
  const { estaAbierta, alternar: alternarSeccion, plegadas } = useSeccionesMenu(seccionActual)

  // El módulo abierto siempre queda a la vista, aunque esté al final del menú.
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('.nav-activa')?.scrollIntoView({ block: 'nearest' })
  }, [pathname, colapsado])

  // Mide el módulo activo para deslizar la píldora hasta él.
  const [resalte, setResalte] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const medir = () => {
      const el = nav.querySelector<HTMLElement>('.nav-activa')
      // Dentro de una sección plegada no se ve: la píldora tampoco.
      if (!el || el.closest('[inert]')) return setResalte(null)
      const n = nav.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      setResalte({ top: r.top - n.top + nav.scrollTop, left: r.left - n.left, width: r.width, height: r.height })
    }
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(nav)
    // Al plegar o desplegar una sección el módulo activo se mueve: se vuelve a
    // medir cuando termina la animación.
    nav.addEventListener('transitionend', medir)
    return () => {
      obs.disconnect()
      nav.removeEventListener('transitionend', medir)
    }
  }, [pathname, colapsado, plegadas])

  return (
    <aside
      className={cn(
        'no-imprimir vidrio relative my-3 ml-3 flex min-h-0 flex-none flex-col gap-3 overflow-hidden rounded-[24px] border border-[var(--rvr-glass-borde)] py-3.5',
        'transition-[width,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        colapsado ? 'w-[76px] px-3' : 'w-[236px] px-3',
        className,
      )}
    >
      <div className="relative">
        <Link
          to={rutaInicial(usuario)}
          title="Ir al panel"
          className={cn(
            'flex items-center gap-[11px] rounded-[14px] py-1.5 transition-colors hover:bg-surface-muted',
            colapsado ? 'justify-center px-0' : 'px-2',
          )}
        >
          <IconoMarca tamano={34} radio="27%" alt="" />
          {!colapsado && (
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold tracking-[-0.2px] text-fg">
                Portal RvR
              </div>
              <div className="text-[12px] font-medium text-fg-subtle">Tecnologías</div>
            </div>
          )}
        </Link>
        <div className="mx-2 mt-3 h-px bg-border-base" />
      </div>

      {/* Los módulos se desplazan con la rueda cuando no caben; la marca y el
          pie quedan fijos. El margen negativo deja ver el riel del activo. */}
      <nav
        ref={navRef}
        className={cn(
          'desplazable-fino relative -mx-3 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-1',
          colapsado ? 'gap-2' : 'gap-4',
        )}
        aria-label="Navegación principal"
      >
        {/* Píldora que se desliza hasta el módulo abierto */}
        {resalte && (
          <span
            aria-hidden="true"
            className="nav-resalte pointer-events-none absolute z-0 rounded-[14px]"
            style={{ top: resalte.top, left: resalte.left, width: resalte.width, height: resalte.height }}
          >
            <span className="absolute top-1/2 -left-[3px] h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_var(--rvr-halo-primary)]" />
          </span>
        )}

        {grupos.map((grupo, indice) => {
          // En el modo de solo íconos no hay títulos: todas las secciones a la vista.
          const abierta = colapsado || estaAbierta(grupo.titulo)
          const idLista = `menu-seccion-${indice}`
          return (
          <div key={grupo.titulo} className="relative flex flex-col gap-1">
            {colapsado ? (
              indice > 0 && <div className="mx-2 mb-1.5 h-px bg-border-base" />
            ) : (
              <button
                type="button"
                onClick={() => alternarSeccion(grupo.titulo)}
                aria-expanded={abierta}
                aria-controls={idLista}
                title={abierta ? `Plegar ${grupo.titulo}` : `Desplegar ${grupo.titulo}`}
                className="group/seccion flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-left text-[11px] font-semibold tracking-[0.12em] text-fg-faint uppercase transition-colors hover:bg-surface-muted/70 hover:text-fg-muted"
              >
                <span className="min-w-0 flex-1 truncate">{grupo.titulo}</span>
                {!abierta && (
                  <span className="rounded-full bg-surface-muted px-1.5 text-[10.5px] tracking-normal text-fg-subtle tabular-nums">
                    {grupo.items.length}
                  </span>
                )}
                <IconSeccion abierta={abierta} />
              </button>
            )}

            {/* Plegado con grid 0fr → 1fr: anima la altura real sin medirla.
                `inert` saca del foco y del lector de pantalla lo que no se ve. */}
            <div
              id={idLista}
              inert={!abierta}
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                abierta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
            <div className="-mx-3 -mb-1 flex min-h-0 flex-col gap-1 overflow-hidden px-3 pb-1">
            {grupo.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={colapsado ? `${item.label}: ${item.descripcion ?? ''}` : item.descripcion}
                aria-label={colapsado ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'nav-lateral group relative z-10 flex items-center rounded-[14px] text-[13.5px]',
                    colapsado ? 'size-[46px] flex-none justify-center self-center hover:translate-x-0' : 'gap-3 py-[6px] pr-2.5 pl-1.5',
                    isActive ? 'nav-activa font-bold text-fg' : 'font-medium text-fg-muted hover:bg-surface-muted/70 hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex size-[30px] flex-none items-center justify-center rounded-[10px] transition-[background-color,color,transform,box-shadow] duration-200 [&_svg]:size-[17px]',
                        isActive
                          ? 'bg-primary text-white shadow-[0_6px_14px_-6px_var(--rvr-halo-primary)]'
                          : 'bg-surface-muted text-fg-subtle group-hover:scale-105 group-hover:bg-primary-soft group-hover:text-primary-on-soft',
                      )}
                    >
                      <item.icon />
                    </span>
                    {!colapsado && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
            </div>
            </div>
          </div>
          )
        })}
      </nav>

      <div className="relative flex flex-none flex-col gap-1.5 border-t border-border-base pt-3">
        <div className={cn('flex gap-1.5', colapsado && 'flex-col items-center')}>
          <Link
            to={ROUTES.inicio}
            title="Ver el sitio público"
            aria-label="Ver el sitio público"
            className={cn(
              'flex items-center gap-2 rounded-[10px] text-[12px] font-medium text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg',
              colapsado ? 'size-[42px] justify-center' : 'h-9 flex-1 px-2',
            )}
          >
            <IconSitio />
            {!colapsado && 'Sitio web'}
          </Link>

          {puedeAlternar && (
            <button
              type="button"
              onClick={onAlternar}
              aria-pressed={colapsado}
              aria-label={colapsado ? 'Desplegar el menú' : 'Plegar el menú'}
              title={colapsado ? 'Desplegar el menú' : 'Plegar el menú'}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-[10px] text-[12px] font-medium text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg',
                colapsado ? 'size-[42px] justify-center' : 'h-9 flex-1 px-2',
              )}
            >
              <IconPliegue colapsado={colapsado} />
              {!colapsado && 'Plegar'}
            </button>
          )}
        </div>

        <Link
          to={ROUTES.perfil}
          className={cn(
            'mt-0.5 flex items-center gap-2.5 transition-colors hover:bg-surface-muted',
            colapsado
              ? 'justify-center rounded-[10px] py-1'
              : 'rounded-[10px] px-2 py-1.5',
          )}
          title={colapsado ? (usuario?.nombre ?? nombreLegible(usuario?.nombreUsuario)) : 'Mi perfil'}
        >
          <span className="relative flex-none">
            <Avatar nombre={usuario?.nombre ?? 'RvR'} />
            {/* Punto de sesión activa: el lateral es lo único visible cuando el
                portal está plegado, y conviene saber con qué cuenta se está. */}
            <span
              aria-hidden="true"
              className="absolute -right-px -bottom-px size-[9px] rounded-full border-2 border-[var(--rvr-ink)] bg-success"
            />
          </span>
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-fg">
                {usuario?.nombre ?? nombreLegible(usuario?.nombreUsuario)}
              </div>
              <div className="truncate text-[12px] font-medium text-fg-subtle">
                {usuario?.rol.nombre ?? '—'}
              </div>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}
