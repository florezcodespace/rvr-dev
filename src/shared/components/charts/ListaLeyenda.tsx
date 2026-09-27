import { varsCss } from '@shared/lib/varsCss'

export interface FilaLeyenda {
  clave: string
  label: string
  color: string
  /** Valor principal de la fila (ya formateado). */
  valor: string
  /** Segunda columna alineada a la derecha: porcentaje, importe, etc. */
  extra?: string
}

/**
 * Leyenda en filas. Cada color va acompañado de su etiqueta y su cifra, así que
 * la identidad de un segmento nunca depende solo del color.
 */
export function ListaLeyenda({
  filas,
  retrasoBase = 260,
  paso = 70,
  anchoExtra = 'w-[46px]',
}: {
  filas: FilaLeyenda[]
  retrasoBase?: number
  paso?: number
  anchoExtra?: string
}) {
  return (
    <ul className="flex list-none flex-col gap-[9px] p-0">
      {filas.map((fila, indice) => (
        <li
          key={fila.clave}
          className="anim-entrada flex items-center gap-2.5 text-[12px] text-fg-muted"
          style={varsCss({ '--retraso': `${retrasoBase + indice * paso}ms` })}
        >
          <span
            aria-hidden="true"
            className="size-[9px] flex-none rounded-[3px]"
            style={{ background: fila.color }}
          />
          <span className="truncate">{fila.label}</span>
          <b className="ml-auto flex-none font-semibold tabular-nums text-fg">
            {fila.valor}
          </b>
          {fila.extra && (
            <span
              className={`${anchoExtra} flex-none text-right text-[11px] text-fg-subtle`}
            >
              {fila.extra}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
