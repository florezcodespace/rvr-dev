import { useState } from 'react'
import { cn } from '@shared/lib/cn'

export interface SegmentoDonut {
  clave: string
  label: string
  valor: number
  color: string
}

const RADIO = 52
const GROSOR = 18
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/**
 * Reparto de un total en pocas categorías. Cada segmento va acompañado de su
 * etiqueta y su valor en la lista: la identidad nunca depende solo del color.
 */
export function Donut({
  segmentos,
  etiquetaTotal,
}: {
  segmentos: SegmentoDonut[]
  etiquetaTotal: string
}) {
  const [activo, setActivo] = useState<string | null>(null)
  const total = segmentos.reduce((s, seg) => s + seg.valor, 0)

  // Cada arco necesita saber cuánto lo precede; se acumula en el reduce.
  const arcos = segmentos.reduce<{
    items: { segmento: SegmentoDonut; proporcion: number; desfase: number }[]
    recorrido: number
  }>(
    (acumulador, segmento) => {
      const proporcion = segmento.valor / Math.max(total, 1)
      acumulador.items.push({ segmento, proporcion, desfase: acumulador.recorrido })
      acumulador.recorrido += proporcion
      return acumulador
    },
    { items: [], recorrido: 0 },
  ).items

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative flex-none">
        <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
          <g transform="rotate(-90 66 66)">
            {arcos.map(({ segmento, proporcion, desfase }) => {
              const dash = proporcion * CIRCUNFERENCIA
              const offset = -desfase * CIRCUNFERENCIA
              return (
                <circle
                  key={segmento.clave}
                  cx="66"
                  cy="66"
                  r={RADIO}
                  fill="none"
                  stroke={segmento.color}
                  strokeWidth={GROSOR}
                  strokeDasharray={`${dash - 2} ${CIRCUNFERENCIA - dash + 2}`}
                  strokeDashoffset={offset}
                  opacity={activo && activo !== segmento.clave ? 0.4 : 1}
                  className="transition-opacity"
                />
              )
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] leading-none font-bold tracking-[-0.8px] text-fg">
            {total}
          </span>
          <span className="text-[10.5px] text-fg-subtle">{etiquetaTotal}</span>
        </div>
      </div>

      <ul className="flex min-w-[150px] flex-1 list-none flex-col gap-2 p-0">
        {segmentos.map((segmento) => (
          <li
            key={segmento.clave}
            onPointerEnter={() => setActivo(segmento.clave)}
            onPointerLeave={() => setActivo(null)}
            className={cn(
              'flex items-center gap-2 rounded-[6px] px-1.5 py-1 text-[12px] transition-colors',
              activo === segmento.clave && 'bg-surface-muted',
            )}
          >
            <span
              aria-hidden="true"
              className="size-2 flex-none rounded-full"
              style={{ background: segmento.color }}
            />
            <span className="text-fg-muted">{segmento.label}</span>
            <span className="ml-auto font-semibold text-fg">{segmento.valor}</span>
            <span className="w-10 text-right text-[11px] text-fg-subtle">
              {Math.round((segmento.valor / Math.max(total, 1)) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
