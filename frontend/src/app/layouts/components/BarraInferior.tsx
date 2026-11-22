import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { InsigniaDemo } from '@app/demo/InsigniaDemo'
import { ROUTES } from '@app/routes/paths'
import { IconX } from '@shared/components/icons'
import { cn } from '@shared/lib/cn'
import { menuDe } from '../navigation'

/** En el celular primero la operación diaria; el resto vive en «Menú». */
const PRIORIDAD: string[] = [ROUTES.cotizaciones, ROUTES.ordenes, ROUTES.agenda, ROUTES.clientes, ROUTES.panel]

const IconMenu = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...props}>
    <line x1="2.5" y1="4" x2="13.5" y2="4" />
    <line x1="2.5" y1="8" x2="13.5" y2="8" />
    <line x1="2.5" y1="12" x2="13.5" y2="12" />
  </svg>
)

const claseDestino = (activo: boolean) =>
  cn(
    'flex min-h-12 flex-col items-center justify-center gap-[5px] rounded-[14px] text-[12px] font-semibold transition-colors',
    activo ? 'bg-primary text-white' : 'text-fg-faint hover:bg-primary-soft hover:text-fg-muted',
  )

/**
 * Navegación de móvil (< 768 px): los tres módulos de operación que el rol
 * puede ver, el perfil y «Menú», que abre todos los módulos del rol agrupados
 * igual que el panel lateral.
 */
export function BarraInferior() {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)
  const grupos = menuDe(usuario)
  const items = grupos.flatMap((g) => g.items)
  const primeros = [
    ...PRIORIDAD.map((to) => items.find((i) => i.to === to)).filter((i) => i !== undefined),
    ...items.filter((i) => !PRIORIDAD.includes(i.to)),
  ].slice(0, 3)

  // Al navegar desde el menú, se cierra
  const [ruta, setRuta] = useState(pathname)
  if (ruta !== pathname) {
    setRuta(pathname)
    setAbierto(false)
  }

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto])

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="no-imprimir vidrio-denso mx-3 mb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] grid flex-none grid-cols-4 gap-1 rounded-[24px] border border-[var(--rvr-glass-borde)] p-1.5 md:hidden"
      >
        {/* [Diseño] Cuatro destinos: con cinco, «Cotizaciones» no cabía en su
            casilla a 390 px. El perfil sigue en el avatar de arriba y en «Menú». */}
        {primeros.map((d) => (
          <NavLink key={d.to} to={d.to} className={({ isActive }) => claseDestino(isActive)}>
            <d.icon />
            {d.label.split(' ')[0]}
          </NavLink>
        ))}
        <button type="button" onClick={() => setAbierto(true)} aria-expanded={abierto} aria-controls="menu-movil" className={cn(claseDestino(abierto), 'cursor-pointer')}>
          <IconMenu />
          Menú
        </button>
      </nav>

      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Todos los módulos">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 cursor-default bg-black/45" onClick={() => setAbierto(false)} />
          <div
            id="menu-movil"
            className="anim-entrada absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto vidrio-denso rounded-t-[26px] border-t border-[var(--rvr-glass-borde)] px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-fg">Módulos <InsigniaDemo /></span>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-fg-muted hover:bg-surface-muted">
                <IconX />
              </button>
            </div>
            {grupos.map((g) => (
              <section key={g.titulo} className="mt-3">
                <h2 className="m-0 mb-1.5 text-[12px] font-medium text-fg-subtle">{g.titulo}</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {g.items.map((i) => (
                    <NavLink
                      key={i.to}
                      to={i.to}
                      className={({ isActive }) =>
                        cn('flex min-h-11 items-center gap-2.5 rounded-[14px] border px-3 text-[13px] font-semibold transition-colors',
                          isActive ? 'border-transparent bg-primary-soft text-primary-on-soft' : 'border-border-base text-fg hover:bg-surface-muted')
                      }
                    >
                      <i.icon className="flex-none" />
                      <span className="min-w-0 leading-tight">{i.label}</span>
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
