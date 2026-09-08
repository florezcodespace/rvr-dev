export interface ItemRanking {
  clave: string | number
  nombre: string
  valor: number
}

/** Ranking horizontal: una sola serie, por eso no lleva leyenda. */
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
      {items.map((item) => (
        <li key={item.clave}>
          <div className="mb-[5px] flex justify-between gap-3 text-[12px]">
            <span className="truncate font-semibold text-fg">{item.nombre}</span>
            <span className="flex-none font-semibold text-fg-muted">
              {item.valor}
              {sufijo ? ` ${sufijo}` : ''}
            </span>
          </div>
          <div
            className="h-[7px] rounded-[4px] bg-surface-muted"
            role="img"
            aria-label={`${item.nombre}: ${item.valor}${sufijo ? ` ${sufijo}` : ''}`}
          >
            <div
              className="h-[7px] rounded-[4px]"
              style={{ width: `${(item.valor / maximo) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
