import { cn } from '@shared/lib/cn'

function paginasVisibles(actual: number, total: number): (number | '…')[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1)
  if (actual <= 3) return [1, 2, 3, '…', total]
  if (actual >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', actual, '…', total]
}

export function Pager({
  pagina,
  totalPaginas,
  info,
  onPagina,
  extra,
}: {
  pagina: number
  totalPaginas: number
  info: string
  onPagina: (pagina: number) => void
  /** Contenido opcional a la izquierda (acciones masivas). */
  extra?: React.ReactNode
}) {
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border-base bg-bg px-4 py-3">
      <div className="flex items-center gap-3">{extra}</div>

      <nav
        className="flex items-center gap-[7px] text-[12px] text-fg-muted"
        aria-label="Paginación"
      >
        <span>{info}</span>

        <button
          type="button"
          onClick={() => onPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
          className="flex size-7 cursor-pointer items-center justify-center rounded-[7px] border border-border-base bg-surface text-fg disabled:cursor-not-allowed disabled:opacity-45"
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
