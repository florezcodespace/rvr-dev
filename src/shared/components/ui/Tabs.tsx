import { cn } from '@shared/lib/cn'

export interface OpcionTab<T extends string> {
  valor: T
  label: string
  /** Cantidad de registros; se muestra al lado del nombre. */
  conteo?: number
}

/**
 * Filtros de un clic. Sustituyen al menú desplegable del filtro más usado:
 * abrir, buscar y elegir eran tres pasos; aquí es uno.
 */
export function Tabs<T extends string>({
  opciones,
  valor,
  onChange,
  etiqueta,
  className,
}: {
  opciones: OpcionTab<T>[]
  valor: T
  onChange: (valor: T) => void
  etiqueta: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className={cn('flex flex-wrap items-center gap-1', className)}
    >
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor
        return (
          <button
            key={opcion.valor}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => onChange(opcion.valor)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-[8px] px-[11px] py-[7px] text-[12.5px] font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rvr-ring-border)]',
              activo
                ? 'bg-primary-soft text-primary-on-soft'
                : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
            )}
          >
            {opcion.label}
            {opcion.conteo !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10.5px] font-bold',
                  activo ? 'bg-primary text-on-primary' : 'text-fg-subtle',
                )}
              >
                {opcion.conteo}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
