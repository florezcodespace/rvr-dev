import { cn } from '@shared/lib/cn'

interface Props {
  seleccionadas: number
  desde: number
  hasta: number
  total: number
  pagina: number
  totalPaginas: number
  onPagina: (pagina: number) => void
  onAccionMasiva: (accion: 'estado' | 'tecnico') => void
}

/** Números de página con elipsis cuando hay muchas. */
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (actual <= 3) return [1, 2, 3, '…', total]
  if (actual >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', actual, '…', total]
}

export function PieTabla({
  seleccionadas,
  desde,
  hasta,
  total,
  pagina,
  totalPaginas,
  onPagina,
  onAccionMasiva,
}: Props) {
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border-base bg-bg px-4 py-3">
      <div className="flex items-center gap-3">
        {seleccionadas > 0 ? (
          <>
            <span className="text-[12px] text-fg-muted">
              {seleccionadas}{' '}
              {seleccionadas === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
            </span>
            <button
              type="button"
              onClick={() => onAccionMasiva('estado')}
              className="h-[30px] cursor-pointer rounded-[8px] border border-border-strong bg-surface px-[11px] text-[11.5px] font-semibold text-fg hover:bg-surface-muted"
            >
              Cambiar estado
            </button>
            <button
              type="button"
              onClick={() => onAccionMasiva('tecnico')}
              className="h-[30px] cursor-pointer rounded-[8px] border border-border-strong bg-surface px-[11px] text-[11.5px] font-semibold text-fg hover:bg-surface-muted"
            >
              Asignar técnico
            </button>
          </>
        ) : (
          <span className="text-[12px] text-fg-subtle">
            Selecciona órdenes para cambiar su estado o asignarles técnico.
          </span>
        )}
      </div>

      <nav
        className="flex items-center gap-[7px] text-[12px] text-fg-muted"
        aria-label="Paginación"
      >
        <span>
          {total === 0 ? 'Sin resultados' : `Mostrando ${desde}–${hasta} de ${total}`}
        </span>

        <button
          type="button"
          onClick={() => onPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
          className="flex size-7 cursor-pointer items-center justify-center rounded-[7px] border border-border-base bg-surface text-fg-faint disabled:cursor-not-allowed disabled:opacity-45"
        >
          ‹
        </button>

        {paginasVisibles(pagina, Math.max(totalPaginas, 1)).map((valor, indice) =>
          valor === '…' ? (
            <span key={`e${indice}`} className="px-0.5 text-fg-faint">
              …
            </span>
          ) : (
            <button
              key={valor}
              type="button"
              onClick={() => onPagina(valor)}
              aria-current={valor === pagina ? 'page' : undefined}
              className={cn(
                'flex size-7 cursor-pointer items-center justify-center rounded-[7px] font-semibold',
                valor === pagina
                  ? 'bg-primary text-on-primary'
                  : 'border border-border-base bg-surface text-fg hover:bg-surface-muted',
              )}
            >
              {valor}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Página siguiente"
          className="flex size-7 cursor-pointer items-center justify-center rounded-[7px] border border-border-base bg-surface text-fg disabled:cursor-not-allowed disabled:opacity-45"
        >
          ›
        </button>
      </nav>
    </div>
  )
}
