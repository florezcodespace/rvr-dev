import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@shared/lib/cn'

/**
 * Diálogo del portal. Se pinta en un portal para que no lo recorte el
 * `overflow` de las tablas, atrapa el foco mientras está abierto y devuelve el
 * foco al control que lo abrió al cerrarse.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  pie,
  ancho = 'md',
  children,
}: {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  pie?: ReactNode
  ancho?: 'sm' | 'md' | 'lg'
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  const foco = useRef<Element | null>(null)
  const id = useId()

  const alPulsar = useCallback(
    (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        onCerrar()
        return
      }
      if (evento.key !== 'Tab' || !panel.current) return

      // Ciclo de foco: con el diálogo abierto, el tabulador no debe escaparse
      // a la página de atrás.
      const focalizables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focalizables.length === 0) return
      const primero = focalizables[0]!
      const ultimo = focalizables[focalizables.length - 1]!

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    },
    [onCerrar],
  )

  useEffect(() => {
    if (!abierto) return

    foco.current = document.activeElement
    const desbordePrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alPulsar)

    const cuadro = requestAnimationFrame(() => {
      panel.current
        ?.querySelector<HTMLElement>('input, select, textarea, button')
        ?.focus()
    })

    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = desbordePrevio
      cancelAnimationFrame(cuadro)
      if (foco.current instanceof HTMLElement) foco.current.focus()
    }
  }, [abierto, alPulsar])

  if (!abierto) return null

  const ANCHOS = { sm: 'max-w-[420px]', md: 'max-w-[560px]', lg: 'max-w-[720px]' }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-[8vh]"
      role="presentation"
      onClick={onCerrar}
    >
      <div className="anim-velo fixed inset-0 bg-[rgb(15_23_42/0.45)] backdrop-blur-[2px] dark:bg-[rgb(0_0_0/0.65)]" />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={descripcion ? `${id}-desc` : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'anim-entrada relative flex w-full flex-col overflow-hidden rounded-[16px] border border-border-base bg-surface shadow-[var(--rvr-shadow-lg)]',
          ANCHOS[ancho],
        )}
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b border-border-base px-5 py-4">
          <div className="min-w-0">
            <h2
              id={`${id}-titulo`}
              className="m-0 text-[16px] font-bold tracking-[-0.3px] text-fg"
            >
              {titulo}
            </h2>
            {descripcion && (
              <p id={`${id}-desc`} className="m-0 mt-1 text-[12.5px] text-fg-muted">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[9px] text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 px-5 py-5">{children}</div>

        {pie && (
          <div className="flex flex-none items-center justify-end gap-2.5 border-t border-border-base bg-surface-muted px-5 py-3.5">
            {pie}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
