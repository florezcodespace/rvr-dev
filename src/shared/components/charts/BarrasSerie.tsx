import { useState } from 'react'
import { cn } from '@shared/lib/cn'

export interface PuntoBarra {
  clave: string
  etiqueta: string
  valor: number
}

/**
 * Barras verticales en el tiempo (ingresos por día o por mes, servicios por
 * semana). Cada barra tiene su valor en el tooltip y la serie completa va en
 * una tabla oculta para lectores de pantalla.
 */
export function BarrasSerie({
  puntos,
  formato = (n) => n.toLocaleString('es-CO'),
  color = 'var(--rvr-chart-1)',
  descripcion,
  alto = 180,
}: {
  puntos: PuntoBarra[]
  formato?: (n: number) => string
  color?: string
  descripcion: string
  alto?: number
}) {
  const [activo, setActivo] = useState<number | null>(null)
  const maximo = Math.max(...puntos.map((p) => p.valor), 1)
  const cadaCuanto = Math.max(1, Math.ceil(puntos.length / 8))

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="relative flex items-end justify-center gap-[3px]" style={{ height: alto }} role="img" aria-label={descripcion}>
        {puntos.map((p, i) => (
          <div
            key={p.clave}
            className="group relative flex h-full max-w-[56px] flex-1 cursor-default items-end"
            onPointerEnter={() => setActivo(i)}
            onPointerLeave={() => setActivo(null)}
          >
            <div
              className={cn('w-full rounded-t-[4px] transition-opacity', activo !== null && activo !== i && 'opacity-45')}
              style={{ height: `${Math.max((p.valor / maximo) * 100, p.valor > 0 ? 2 : 0)}%`, background: color }}
            />
            {activo === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-[8px] border border-border-base bg-surface px-2 py-1 text-[11px] whitespace-nowrap shadow-[var(--rvr-shadow-lg)]">
                <div className="font-semibold text-fg">{formato(p.valor)}</div>
                <div className="text-fg-subtle">{p.etiqueta}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-[3px]" aria-hidden="true">
        {puntos.map((p, i) => (
          <div key={p.clave} className="relative h-3.5 max-w-[56px] flex-1">
            {i % cadaCuanto === 0 && (
              <span className={cn('absolute top-0 text-[10px] whitespace-nowrap text-fg-faint', i === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2')}>{p.etiqueta}</span>
            )}
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{descripcion}</caption>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.clave}><th scope="row">{p.etiqueta}</th><td>{formato(p.valor)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
