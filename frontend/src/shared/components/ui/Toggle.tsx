import { cn } from '@shared/lib/cn'

export function Toggle({
  activo,
  onChange,
  etiqueta,
  disabled = false,
}: {
  activo: boolean
  onChange: (valor: boolean) => void
  /** Texto para lectores de pantalla cuando el control va sin <label> visible. */
  etiqueta: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      className={cn(
        'relative h-[22px] w-10 flex-none cursor-pointer rounded-full transition-colors',
        activo ? 'bg-primary' : 'bg-border-strong',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-[left]',
          activo ? 'left-[21px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}
