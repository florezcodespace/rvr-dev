import { useRef, useState, type ReactNode } from 'react'
import { useClickAfuera } from '@shared/hooks/useClickAfuera'
import { cn } from '@shared/lib/cn'

export interface DropdownProps {
  /** Contenido del disparador. */
  etiqueta: ReactNode
  /** Resalta el disparador cuando el filtro está aplicado. */
  activo?: boolean
  /**
   * Disparador con aspecto de campo de formulario (40 px de alto y ancho completo)
   * en vez del chip de filtro.
   */
  etiquetaComoCaja?: boolean
  invalido?: boolean
  id?: string
  describedBy?: string
  /** Contenido del panel; recibe una función para cerrarlo. */
  children: (cerrar: () => void) => ReactNode
  align?: 'left' | 'right'
  className?: string
  panelClassName?: string
}

/** Disparador + panel flotante, con cierre por clic afuera y Escape. */
export function Dropdown({
  etiqueta,
  activo = false,
  etiquetaComoCaja = false,
  invalido = false,
  id,
  describedBy,
  children,
  align = 'left',
  className,
  panelClassName,
}: DropdownProps) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useClickAfuera(contenedor, () => setAbierto(false), abierto)

  return (
    <div ref={contenedor} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-invalid={invalido || undefined}
        aria-describedby={describedBy}
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          'flex cursor-pointer items-center gap-2 transition-colors',
          etiquetaComoCaja
            ? 'h-10 w-full rounded-[9px] border bg-surface px-3 text-left'
            : 'h-9 rounded-[9px] px-[11px] text-[12.5px]',
          etiquetaComoCaja
            ? invalido
              ? 'border-[1.5px] border-danger'
              : abierto
                ? 'border-[1.5px] border-[var(--rvr-ring-border)] shadow-[0_0_0_3px_var(--rvr-ring)]'
                : 'border-border-strong hover:bg-surface-muted'
            : activo
              ? 'border-[1.5px] border-primary bg-primary-soft font-semibold text-primary-on-soft'
              : 'border border-border-strong bg-surface font-medium text-fg-muted hover:bg-surface-muted',
        )}
      >
        {etiqueta}
        <span
          aria-hidden="true"
          className={cn(
            'text-[10px]',
            etiquetaComoCaja ? 'ml-auto text-fg-faint' : activo ? '' : 'text-fg-faint',
          )}
        >
          ▾
        </span>
      </button>

      {abierto && (
        <div
          role="listbox"
          className={cn(
            'absolute top-[calc(100%+6px)] z-30 min-w-[220px] rounded-[10px] border border-border-base bg-surface p-2 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  )
}
