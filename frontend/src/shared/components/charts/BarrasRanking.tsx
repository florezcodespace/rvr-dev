import { Bloques } from './Bloques'
import { varsCss } from '@shared/lib/varsCss'

export interface ItemRanking {
  clave: string | number
  nombre: string
  valor: number
}

const BLOQUES = 16

/**
 * Ranking en bloques: el primero llena la fila y los demás se leen contra él.
 * Una sola serie, por eso no lleva leyenda.
 */
export function BarrasRanking({
  items,
  color = 'var(--rvr-chart-1)',
  sufijo,
}: {
  items: ItemRanking[]
  color?: string
  sufijo?: string
}) {
  const maximo = Math.max(...items.map((i) => i.valor), 1)

  return (
    <ul className="flex list-none flex-col gap-[11px] p-0">
      {items.map((item, indice) => {
        const llenos = Math.max(1, Math.round((item.valor / maximo) * BLOQUES))
        const texto = `${item.valor}${sufijo ? ` ${sufijo}` : ''}`

        return (
          <li
            key={item.clave}
            className="anim-entrada flex flex-col gap-[5px]"
            style={varsCss({ '--retraso': `${120 + indice * 70}ms` })}
            aria-label={`${item.nombre}: ${texto}`}
          >
            <div className="flex justify-between gap-3 text-[12px]">
              <span className="truncate font-semibold text-fg">{item.nombre}</span>
              <span className="flex-none font-semibold tabular-nums text-fg-muted">
                {texto}
              </span>
            </div>
            <Bloques
              total={BLOQUES}
              llenos={llenos}
              color={color}
              retrasoBase={140 + indice * 70}
            />
          </li>
        )
      })}
    </ul>
  )
}
