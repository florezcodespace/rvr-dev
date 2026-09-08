import { MenuFlotante } from '@shared/components/data'
import { Avatar } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import type { OpcionFiltro } from '../types'

/**
 * Asignar o cambiar el técnico desde la propia fila, sin abrir la orden.
 * "Sin asignar" es el caso que más se toca, por eso se ve como una acción.
 */
export function SelectorTecnico({
  tecnicoNombre,
  tecnicos,
  registro,
  onAsignar,
}: {
  tecnicoNombre: string | null
  tecnicos: OpcionFiltro[]
  registro: string
  onAsignar: (tecnicoId: number | null) => void
}) {
  return (
    <MenuFlotante
      titulo="Asignar a"
      etiquetaAccesible={`Asignar técnico a ${registro}`}
      ancho={232}
      items={[
        ...tecnicos.map((tecnico) => ({
          clave: String(tecnico.id),
          contenido: (
            <>
              <Avatar nombre={tecnico.nombre} tamano="sm" />
              {tecnico.nombre}
            </>
          ),
          onSelect: () => onAsignar(tecnico.id),
        })),
        {
          clave: 'ninguno',
          contenido: <span className="text-fg-muted italic">Sin asignar</span>,
          onSelect: () => onAsignar(null),
        },
      ]}
      disparador={(props) => (
        <button
          {...props}
          aria-label={
            tecnicoNombre
              ? `Técnico ${tecnicoNombre} en ${registro}. Cambiar técnico`
              : `${registro} sin técnico. Asignar técnico`
          }
          className={cn(
            'flex w-full cursor-pointer items-center gap-1.5 rounded-[7px] px-1.5 py-1 text-left text-[12.5px] transition-colors hover:bg-surface-muted',
            tecnicoNombre ? 'text-fg-muted' : 'font-semibold text-link',
          )}
        >
          <span className="truncate">{tecnicoNombre ?? 'Asignar'}</span>
          <span aria-hidden="true" className="ml-auto text-[9px] text-fg-faint">
            ▾
          </span>
        </button>
      )}
    />
  )
}
