import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ROUTES } from '@app/routes/paths'
import { Particulas } from '@shared/components/decor'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { Avatar } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import { nombreLegible } from '@shared/lib/format'
import { menuDe, rutaInicial } from '../navigation'

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

  // El módulo abierto siempre queda a la vista, aunque esté al final del menú.
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('.nav-activa')?.scrollIntoView({ block: 'nearest' })
  }, [pathname, colapsado])

  return (
    <aside
      className={cn(
        'no-imprimir superficie-lateral relative flex h-full min-h-0 flex-none flex-col gap-3 overflow-hidden border-r border-border-base py-3.5',
        'transition-[width,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        colapsado ? 'w-[76px] px-3' : 'w-[236px] px-3',
        className,
      )}
    >
      {/* Solo partículas, y pocas: el lateral es una columna estrecha llena de
          texto, y unas manchas de color detrás la volverían ilegible. */}
      <Particulas
        cantidad={9}
        semilla={41}
        opacidadMaxima={0.3}
        puntoClase="bg-[var(--rvr-primary)] dark:bg-[#a5b4fc]"
      />

      <div className="relative">
        <Link
          to={rutaInicial(usuario)}
          title="Ir al panel"
          className={cn(
            'flex items-center gap-[11px] rounded-[11px] py-1.5 transition-colors hover:bg-surface-muted',
            colapsado ? 'justify-center px-0' : 'px-2',
          )}
        >
          <IconoMarca tamano={34} radio="27%" alt="" />
          {!colapsado && (
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-bold tracking-[-0.2px] text-fg">
                Portal RvR
              </div>
              <div className="text-[10.5px] font-medium text-fg-subtle">Tecnologías</div>
            </div>
          )}
        </Link>
        <div className="mt-3 h-px bg-border-base" />
      </div>

      {/* Los módulos se desplazan con la rueda cuando no caben; la marca y el
          pie quedan fijos. El margen negativo deja ver el riel del activo. */}
      <nav
        ref={navRef}
        className={cn(
          'desplazable-fino relative -mx-3 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-1',
          colapsado ? 'gap-2' : 'gap-3.5',
        )}
        aria-label="Navegación principal"
      >
        {menuDe(usuario).map((grupo, indice) => (
          <div key={grupo.titulo} className="flex flex-col gap-[3px]">
            {colapsado ? (
              indice > 0 && <div className="mx-2 mb-1.5 h-px bg-border-base" />
            ) : (
              <div className="flex items-center gap-2 px-2.5 pb-1">
                <span className="text-[10px] font-bold tracking-[0.12em] text-fg-faint uppercase">
                  {grupo.titulo}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-border-base" />
              </div>
            )}

            {grupo.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}

                title={colapsado ? item.label : undefined}
                aria-label={colapsado ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'nav-lateral flex items-center rounded-[10px] text-[13.5px]',
                    colapsado
                      ? 'nav-riel size-[42px] flex-none justify-center self-center hover:translate-x-0'
                      : 'gap-2.5 py-[5px] pr-2.5 pl-[6px]',
                    isActive
                      ? colapsado
                        ? 'nav-activa bg-primary font-semibold text-on-primary'
                        : 'nav-activa bg-primary-soft font-semibold text-primary-on-soft'
                      : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
                  )
                }
              >
                {({ isActive }) =>
                  colapsado ? (
                    <>
                      <item.icon className="flex-none" />
                    </>
                  ) : (
                    <>
                      {/* Pastilla del icono: rellena cuando el módulo está
                          abierto. El estado se reconoce por la forma, no solo
                          por un cambio de tinte. */}
                      <span
                        className={cn(
                          'flex size-[26px] flex-none items-center justify-center rounded-[8px] transition-colors',
                          isActive
                            ? 'bg-primary text-on-primary shadow-[0_6px_14px_-7px_var(--rvr-primary)]'
                            : 'bg-surface-muted text-fg-subtle',
                        )}
                      >
                        <item.icon />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </>
                  )
                }
              </NavLink>
            ))}
          </div>
        ))}
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
              : 'rounded-[12px] border border-border-base bg-surface/70 px-2.5 py-1.5',
          )}
          title={colapsado ? (usuario?.nombre ?? nombreLegible(usuario?.nombreUsuario)) : 'Mi perfil'}
        >
          <span className="relative flex-none">
            <Avatar nombre={usuario?.nombre ?? 'RvR'} />
            {/* Punto de sesión activa: el lateral es lo único visible cuando el
                portal está plegado, y conviene saber con qué cuenta se está. */}
            <span
              aria-hidden="true"
              className="absolute -right-px -bottom-px size-[9px] rounded-full border-2 border-[var(--rvr-surface)] bg-success"
            />
          </span>
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-fg">
                {usuario?.nombre ?? nombreLegible(usuario?.nombreUsuario)}
              </div>
              <div className="truncate text-[10.5px] font-medium text-fg-subtle">
                {usuario?.rol.nombre ?? '—'}
              </div>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}
