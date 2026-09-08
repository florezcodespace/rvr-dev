import { useTheme } from '@shared/hooks/useTheme'
import { cn } from '@shared/lib/cn'
import type { ResolvedTheme } from '@shared/types/theme'

const OPTIONS: { value: ResolvedTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/**
 * Segmento Light / Dark idéntico al del header del mockup.
 * Elegir una opción deja de seguir la preferencia del sistema.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setMode } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la interfaz"
      className={cn(
        'flex items-center gap-0.5 rounded-[9px] bg-surface-muted p-[3px]',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(option.value)}
            className={cn(
              'cursor-pointer rounded-[7px] px-2.5 py-[5px] text-[11.5px] font-semibold transition-colors',
              active
                ? 'bg-surface text-fg shadow-xs'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
