import { forwardRef, useId } from 'react'
import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@shared/lib/cn'

export const CLASE_CAMPO =
  'w-full rounded-[10px] border bg-surface px-3.5 text-[13.5px] text-fg outline-none transition-[box-shadow,border-color] placeholder:text-fg-faint focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)] disabled:cursor-not-allowed disabled:opacity-60'

interface Envoltura {
  label?: string
  error?: string
  ayuda?: ReactNode
  className?: string
}

function Pie({ id, error, ayuda }: { id: string; error?: string; ayuda?: ReactNode }) {
  if (error) return <p id={`${id}-error`} className="mt-1.5 text-[11.5px] text-danger-fg">{error}</p>
  if (ayuda) return <p id={`${id}-ayuda`} className="mt-1.5 text-[11.5px] text-fg-subtle">{ayuda}</p>
  return null
}

/** Lista desplegable con etiqueta y error, con el mismo aspecto que `Input`. */
export const Select = forwardRef<HTMLSelectElement, Envoltura & SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { label, error, ayuda, className, id, children, ...props },
  ref,
) {
  const generado = useId()
  const campoId = id ?? generado
  return (
    <div className={cn('flex flex-col', className)}>
      {label && <label htmlFor={campoId} className="mb-1.5 text-[12.5px] font-semibold text-fg">{label}</label>}
      <select
        ref={ref}
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${campoId}-error` : ayuda ? `${campoId}-ayuda` : undefined}
        className={cn(CLASE_CAMPO, 'h-11 cursor-pointer', error ? 'border-danger' : 'border-border-strong')}
        {...props}
      >
        {children}
      </select>
      <Pie id={campoId} error={error} ayuda={ayuda} />
    </div>
  )
})

/** Área de texto con etiqueta y error. */
export const AreaTexto = forwardRef<HTMLTextAreaElement, Envoltura & TextareaHTMLAttributes<HTMLTextAreaElement>>(function AreaTexto(
  { label, error, ayuda, className, id, rows = 3, ...props },
  ref,
) {
  const generado = useId()
  const campoId = id ?? generado
  return (
    <div className={cn('flex flex-col', className)}>
      {label && <label htmlFor={campoId} className="mb-1.5 text-[12.5px] font-semibold text-fg">{label}</label>}
      <textarea
        ref={ref}
        id={campoId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${campoId}-error` : ayuda ? `${campoId}-ayuda` : undefined}
        className={cn(CLASE_CAMPO, 'py-2.5 leading-[1.5]', error ? 'border-danger' : 'border-border-strong')}
        {...props}
      />
      <Pie id={campoId} error={error} ayuda={ayuda} />
    </div>
  )
})

/** Filtro compacto de las barras de listado (estado, categoría, rol…). */
export function FiltroSelect({
  etiqueta,
  valor,
  onChange,
  opciones,
  todos = 'Todos',
  className,
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  opciones: { valor: string; label: string }[]
  todos?: string
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex max-w-full min-w-0 items-center gap-2', className)}>
      <label htmlFor={id} className="text-[11.5px] font-semibold whitespace-nowrap text-fg-subtle">{etiqueta}</label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] min-w-0 max-w-[14rem] cursor-pointer text-ellipsis rounded-[8px] border border-border-base bg-surface px-2.5 text-[12.5px] text-fg outline-none focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]"
      >
        <option value="">{todos}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/** Filtro de fecha compacto (desde / hasta). */
export function FiltroFecha({
  etiqueta,
  valor,
  onChange,
  min,
  max,
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  min?: string
  max?: string
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[11.5px] font-semibold whitespace-nowrap text-fg-subtle">{etiqueta}</label>
      <input
        id={id}
        type="date"
        value={valor}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] rounded-[8px] border border-border-base bg-surface px-2.5 text-[12.5px] text-fg outline-none focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]"
      />
    </div>
  )
}
