import type { EstadoMeta } from '@shared/domain/tipos'
import { cn } from '@shared/lib/cn'
import { EstadoBadge } from './EstadoBadge'
import { MenuFlotante } from './MenuFlotante'

interface Props<E extends string> {
  valor: E
  meta: Record<E, EstadoMeta>
  /** Destinos válidos desde el estado actual. */
  transiciones: readonly E[]
  onCambiar: (destino: E) => void
  /** Nombre del registro, para el texto accesible ("Cambiar estado de OS-0142"). */
  registro: string
  className?: string
}

/**
 * Cambio de estado en un clic: el badge ES el control. Ofrece únicamente las
 * transiciones válidas del flujo, así no hay que abrir el registro, buscar un
 * desplegable y guardar.
 */
export function SelectorEstado<E extends string>({
  valor,
  meta,
  transiciones,
  onCambiar,
  registro,
  className,
}: Props<E>) {
  if (transiciones.length === 0) {
    return (
      <EstadoBadge
        meta={meta[valor]}
        className={cn('cursor-default', className)}
      />
    )
  }

  return (
    <MenuFlotante
      titulo="Cambiar a"
      etiquetaAccesible={`Cambiar estado de ${registro}`}
      items={transiciones.map((destino) => ({
        clave: destino,
        contenido: <EstadoBadge meta={meta[destino]} />,
        onSelect: () => onCambiar(destino),
      }))}
      disparador={(props) => (
        <button
          {...props}
          aria-label={`Estado ${meta[valor].label} de ${registro}. Cambiar estado`}
          className={cn(
            'group cursor-pointer rounded-[7px] transition-shadow hover:shadow-xs',
            className,
          )}
        >
          <EstadoBadge
            meta={meta[valor]}
            className="after:ml-0.5 after:text-[9px] after:opacity-50 after:content-['▾']"
          />
        </button>
      )}
    />
  )
}
