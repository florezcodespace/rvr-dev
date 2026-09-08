import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import { Spinner } from '@shared/components/ui/Spinner'

export interface Columna<T> {
  clave: string
  titulo: string
  /** Ancho CSS de la columna (`<col>`); el resto se reparte. */
  ancho?: string
  alinear?: 'left' | 'right'
  render: (fila: T) => ReactNode
}

interface Props<T> {
  columnas: Columna<T>[]
  filas: T[]
  claveFila: (fila: T) => string | number
  cargando?: boolean
  /** Fila navegable: clic o Enter abren el registro. */
  onAbrir?: (fila: T) => void
  vacio?: { titulo: string; descripcion: string }
  className?: string
}

/**
 * Tabla de listado del portal. Es un `<table>` real (no una rejilla de divs) para
 * que los lectores de pantalla anuncien encabezados y las celdas se relacionen
 * con su columna.
 */
export function DataTable<T>({
  columnas,
  filas,
  claveFila,
  cargando = false,
  onAbrir,
  vacio,
  className,
}: Props<T>) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-auto', className)}>
      <table className="w-full border-collapse text-left">
        <colgroup>
          {columnas.map((columna) => (
            <col key={columna.clave} style={{ width: columna.ancho }} />
          ))}
        </colgroup>

        <thead className="sticky top-0 z-10">
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                className={cn(
                  'border-b border-border-base bg-bg px-4 py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase',
                  columna.alinear === 'right' && 'text-right',
                )}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className={cn(cargando && 'pointer-events-none opacity-50')}>
          {filas.map((fila) => (
            <tr
              key={claveFila(fila)}
              tabIndex={onAbrir ? 0 : undefined}
              onClick={onAbrir ? () => onAbrir(fila) : undefined}
              onKeyDown={
                onAbrir
                  ? (evento) => {
                      if (evento.key === 'Enter' && evento.target === evento.currentTarget) {
                        onAbrir(fila)
                      }
                    }
                  : undefined
              }
              className={cn(
                'border-b border-border-base transition-colors',
                onAbrir && 'cursor-pointer hover:bg-bg focus-visible:bg-bg',
              )}
            >
              {columnas.map((columna) => (
                <td
                  key={columna.clave}
                  className={cn(
                    'px-4 py-[13px] text-[12.5px] text-fg-muted',
                    columna.alinear === 'right' && 'text-right',
                  )}
                >
                  {columna.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {filas.length === 0 && !cargando && vacio && (
        <div className="flex flex-col items-center gap-1.5 px-4 py-16 text-center">
          <p className="m-0 text-[14px] font-semibold text-fg">{vacio.titulo}</p>
          <p className="m-0 text-[12.5px] text-fg-muted">{vacio.descripcion}</p>
        </div>
      )}

      {filas.length === 0 && cargando && (
        <div className="flex items-center justify-center py-16 text-fg-subtle">
          <Spinner className="size-5" />
        </div>
      )}
    </div>
  )
}
