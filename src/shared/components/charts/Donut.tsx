import { useState } from 'react'
import { varsCss } from '@shared/lib/varsCss'
import { ListaLeyenda } from './ListaLeyenda'

export interface SegmentoDonut {
  clave: string
  label: string
  valor: number
  color: string
}

const RADIO = 52
const GROSOR = 19
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/**
 * Reparto de un total en pocas categorías. Los arcos se dibujan girando hasta su
 * posición; cada uno va acompañado de su etiqueta y su valor en la lista, así
 * que la identidad nunca depende solo del color.
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
      <div
        className="relative flex-none"
        onPointerLeave={() => setActivo(null)}
      >
        <svg width="136" height="136" viewBox="0 0 136 136" aria-hidden="true">
          <g transform="rotate(-90 68 68)">
            {arcos.map(({ segmento, proporcion, desfase }, indice) => {
              const dash = proporcion * CIRCUNFERENCIA
              const offset = -desfase * CIRCUNFERENCIA
              return (
                <circle
                  key={segmento.clave}
                  cx="68"
                  cy="68"
                  r={RADIO}
                  fill="none"
                  stroke={segmento.color}
                  strokeWidth={GROSOR}
                  strokeDasharray={`${Math.max(dash - 2, 0)} ${CIRCUNFERENCIA - dash + 2}`}
                  strokeDashoffset={offset}
                  opacity={activo && activo !== segmento.clave ? 0.35 : 1}
                  className="anim-arco transition-opacity"
                  style={varsCss({
                    '--arco': CIRCUNFERENCIA,
                    '--retraso': `${180 + indice * 130}ms`,
                  })}
                  onPointerEnter={() => setActivo(segmento.clave)}
                />
              )
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] leading-none font-bold tracking-[-0.9px] tabular-nums text-fg">
            {total}
          </span>
          <span className="text-[10.5px] text-fg-subtle">{etiquetaTotal}</span>
        </div>
      </div>

      <div className="min-w-[160px] flex-1">
        <ListaLeyenda
          retrasoBase={260}
          filas={segmentos.map((segmento) => ({
            clave: segmento.clave,
            label: segmento.label,
            color: segmento.color,
            valor: String(segmento.valor),
            extra: `${Math.round((segmento.valor / Math.max(total, 1)) * 100)} %`,
          }))}
        />
      </div>
    </div>
  )
}
