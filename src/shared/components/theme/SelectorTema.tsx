import { useTheme } from '@shared/hooks/useTheme'
import { cn } from '@shared/lib/cn'
import type { ThemeMode } from '@shared/types/theme'

const OPCIONES: { valor: ThemeMode; titulo: string; ayuda: string }[] = [
  { valor: 'light', titulo: 'Claro', ayuda: 'Fondo blanco' },
  { valor: 'dark', titulo: 'Oscuro', ayuda: 'Fondo negro' },
  { valor: 'system', titulo: 'Según el sistema', ayuda: 'Sigue a Windows' },
]

/** Muestra en miniatura de cómo queda el portal con cada opción. */
function Muestra({ valor }: { valor: ThemeMode }) {
  if (valor === 'system') {
    return (
      <span
        aria-hidden="true"
        className="flex h-[38px] w-full overflow-hidden rounded-[7px] border border-border-base"
      >
        <span className="flex-1 bg-[#F8FAFC]" />
        <span className="flex-1 bg-[#09090B]" />
      </span>
    )
  }

  const oscuro = valor === 'dark'
  // Los valores van en línea a propósito: la muestra tiene que verse igual en
  // los dos temas, así que no puede usar los tokens de la sesión actual.
  const panel = oscuro ? '#18181B' : '#E9EEF5'
  const tarjeta = oscuro ? '#27272A' : '#FFFFFF'

  return (
    <span
      aria-hidden="true"
      className="flex h-[38px] w-full gap-1 overflow-hidden rounded-[7px] border border-border-base p-1"
      style={{ background: oscuro ? '#09090B' : '#F8FAFC' }}
    >
      <span className="w-[22%] rounded-[3px]" style={{ background: panel }} />
      <span className="flex flex-1 flex-col gap-1">
        <span className="h-1/2 rounded-[3px] bg-[#4F46E5]" />
        <span className="h-1/2 rounded-[3px]" style={{ background: tarjeta }} />
      </span>
    </span>
  )
}

/**
 * Elección de tema de **esta** sesión. Se aplica al instante y se guarda sola en
 * `localStorage`: no entra en el borrador de Configuración porque no es un ajuste
 * de la organización, y obligar a pulsar "Guardar" para ver el cambio sería raro.
 */
export function SelectorTema() {
  const { mode, setMode } = useTheme()

  return (
    <div role="radiogroup" aria-label="Tema de la interfaz" className="grid gap-2.5 sm:grid-cols-3">
      {OPCIONES.map((opcion) => {
        const activa = mode === opcion.valor
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={() => setMode(opcion.valor)}
            className={cn(
              'flex cursor-pointer flex-col gap-2 rounded-[11px] border p-2.5 text-left transition-[border-color,background-color]',
              activa
                ? 'border-primary bg-primary-soft'
                : 'border-border-base hover:border-border-strong hover:bg-surface-muted',
            )}
          >
            <Muestra valor={opcion.valor} />
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-[15px] flex-none items-center justify-center rounded-full border',
                  activa ? 'border-primary bg-primary' : 'border-border-strong',
                )}
              >
                {activa && <span className="size-[5px] rounded-full bg-on-primary" />}
              </span>
              <span
                className={cn(
                  'text-[12.5px] font-semibold',
                  activa ? 'text-primary-on-soft' : 'text-fg',
                )}
              >
                {opcion.titulo}
              </span>
            </span>
            <span className="text-[11px] text-fg-subtle">{opcion.ayuda}</span>
          </button>
        )
      })}
    </div>
  )
}
