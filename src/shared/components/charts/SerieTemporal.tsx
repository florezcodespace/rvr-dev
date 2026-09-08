import { useMemo, useState } from 'react'
import { cn } from '@shared/lib/cn'

const ANCHO = 420
const ALTO = 120

export interface PuntoSerie {
  /** Etiqueta del eje (ya formateada). */
  etiqueta: string
  a: number
  b: number
}

export interface ConfigSeries {
  a: { label: string; color: string }
  b: { label: string; color: string; discontinua?: boolean }
}

function coordenadas(datos: PuntoSerie[], clave: 'a' | 'b', maximo: number) {
  const paso = datos.length > 1 ? ANCHO / (datos.length - 1) : 0
  return datos.map((punto, i) => ({
    x: i * paso,
    y: ALTO - (punto[clave] / maximo) * (ALTO - 12),
  }))
}

const aPath = (ps: { x: number; y: number }[]) =>
  ps.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

/**
 * Dos series en el tiempo, con área bajo la primera, crosshair y tooltip.
 * La segunda serie va punteada: nunca se distinguen solo por color.
 */
export function SerieTemporal({
  datos,
  series,
  descripcion,
  etiquetasEje,
}: {
  datos: PuntoSerie[]
  series: ConfigSeries
  descripcion: string
  /** Índices del eje a rotular; por defecto 5 repartidos. */
  etiquetasEje?: number[]
}) {
  const [activo, setActivo] = useState<number | null>(null)

  const { maximo, lineas, marcas } = useMemo(() => {
    const max = Math.max(...datos.flatMap((d) => [d.a, d.b]), 1)
    const indices =
      etiquetasEje ??
      Array.from({ length: Math.min(5, datos.length) }, (_, i) =>
        Math.round((i * (datos.length - 1)) / Math.max(Math.min(5, datos.length) - 1, 1)),
      )
    return {
      maximo: max,
      lineas: {
        a: coordenadas(datos, 'a', max),
        b: coordenadas(datos, 'b', max),
      },
      marcas: [...new Set(indices)].map((i) => datos[i]?.etiqueta ?? ''),
    }
  }, [datos, etiquetasEje])

  const posicionX = (indice: number) =>
    datos.length > 1 ? (indice / (datos.length - 1)) * 100 : 0

  const moverPuntero = (evento: React.PointerEvent<HTMLDivElement>) => {
    const rect = evento.currentTarget.getBoundingClientRect()
    const proporcion = (evento.clientX - rect.left) / rect.width
    const indice = Math.round(proporcion * (datos.length - 1))
    setActivo(Math.min(Math.max(indice, 0), datos.length - 1))
  }

  const punto = activo !== null ? datos[activo] : undefined

  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        tabIndex={0}
        aria-label={descripcion}
        className="relative cursor-crosshair rounded-[6px] outline-offset-4"
        onPointerMove={moverPuntero}
        onPointerLeave={() => setActivo(null)}
        onBlur={() => setActivo(null)}
        onKeyDown={(evento) => {
          if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return
          evento.preventDefault()
          setActivo((previo) => {
            const base = previo ?? 0
            const siguiente = evento.key === 'ArrowRight' ? base + 1 : base - 1
            return Math.min(Math.max(siguiente, 0), datos.length - 1)
          })
        }}
      >
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          preserveAspectRatio="none"
          className="block h-32 w-full"
          aria-hidden="true"
        >
          {[30, 60, 90].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2={ANCHO}
              y2={y}
              stroke="var(--rvr-chart-grid)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <polygon
            points={`${lineas.a.map((p) => `${p.x},${p.y}`).join(' ')} ${ANCHO},${ALTO} 0,${ALTO}`}
            fill={series.a.color}
            opacity="0.08"
          />

          <path
            d={aPath(lineas.a)}
            fill="none"
            stroke={series.a.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={aPath(lineas.b)}
            fill="none"
            stroke={series.b.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={series.b.discontinua === false ? undefined : '5 4'}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {activo !== null && punto && (
          <>
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-border-strong"
              style={{ left: `${posicionX(activo)}%` }}
            />
            {(['a', 'b'] as const).map((clave) => (
              <span
                key={clave}
                className="pointer-events-none absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
                style={{
                  left: `${posicionX(activo)}%`,
                  top: `${(lineas[clave][activo]!.y / ALTO) * 100}%`,
                  background: series[clave].color,
                }}
              />
            ))}
            <div
              className={cn(
                'pointer-events-none absolute -top-1 z-10 w-max rounded-[8px] border border-border-base bg-surface px-2.5 py-1.5 shadow-md',
                posicionX(activo) > 65 && '-translate-x-full',
              )}
              style={{
                left: `calc(${posicionX(activo)}% ${posicionX(activo) > 65 ? '- 8px' : '+ 8px'})`,
              }}
              role="status"
            >
              <div className="font-mono text-[10px] font-medium text-fg-faint">
                {punto.etiqueta}
              </div>
              {(['a', 'b'] as const).map((clave) => (
                <div
                  key={clave}
                  className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-fg-muted"
                >
                  <span
                    className="size-[7px] rounded-full"
                    style={{ background: series[clave].color }}
                  />
                  {series[clave].label}
                  <strong className="ml-auto pl-2 font-semibold text-fg">
                    {punto[clave]}
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between font-mono text-[10px] font-medium text-fg-faint">
        {marcas.map((marca, i) => (
          <span key={`${marca}-${i}`}>{marca}</span>
        ))}
      </div>

      <div className="sr-only">
        <table>
          <caption>{descripcion} (máximo {maximo})</caption>
          <thead>
            <tr>
              <th scope="col">Periodo</th>
              <th scope="col">{series.a.label}</th>
              <th scope="col">{series.b.label}</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d) => (
              <tr key={d.etiqueta}>
                <th scope="row">{d.etiqueta}</th>
                <td>{d.a}</td>
                <td>{d.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function LeyendaSeries({ series }: { series: ConfigSeries }) {
  return (
    <div className="flex gap-3 text-[11px] font-medium text-fg-muted">
      {(['a', 'b'] as const).map((clave) => (
        <span key={clave} className="flex items-center gap-[5px]">
          <span
            className="h-[3px] w-[9px] rounded-[2px]"
            style={{ background: series[clave].color }}
          />
          {series[clave].label}
        </span>
      ))}
    </div>
  )
}
