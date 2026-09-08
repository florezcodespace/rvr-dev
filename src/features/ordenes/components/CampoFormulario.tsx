import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '@shared/lib/cn'

export interface CampoProps {
  label: string
  obligatorio?: boolean
  /** Texto de apoyo bajo el campo; se reemplaza por el error cuando lo hay. */
  ayuda?: ReactNode
  error?: string
  children: (props: { id: string; describedBy: string | undefined }) => ReactNode
  className?: string
}

/** Etiqueta + control + línea de ayuda/error, con el marcado del mockup. */
export function CampoFormulario({
  label,
  obligatorio = false,
  ayuda,
  error,
  children,
  className,
}: CampoProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined

  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <label htmlFor={id} className="mb-1.5 text-[12px] font-semibold text-fg">
        {label} {obligatorio && <span className="text-danger">*</span>}
      </label>

      {children({ id, describedBy })}

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-[5px] flex items-center gap-1.5 text-[11px] font-medium text-danger-fg"
        >
          <span
            aria-hidden="true"
            className="flex size-[13px] flex-none items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white"
          >
            !
          </span>
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="mt-[5px] text-[11px] text-fg-subtle">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

/** Caja con el aspecto de los controles del mockup (40 px, borde, foco). */
export const CLASES_CONTROL =
  'h-10 w-full rounded-[9px] border border-border-strong bg-surface px-3 text-[13px] text-fg outline-none transition-[box-shadow,border-color] focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)] disabled:cursor-not-allowed'
