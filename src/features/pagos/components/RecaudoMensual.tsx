import { useState } from 'react'
import { Card, CardHeader } from '@shared/components/ui'
import { formatearMoneda } from '@shared/lib/format'
import type { RecaudoMes } from '../types'

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

const etiquetaMes = (iso: string) => MESES[Number(iso.slice(5, 7)) - 1] ?? iso

/** Recaudo mensual contra la meta. Una sola serie: sin leyenda, con línea de meta rotulada. */
export function RecaudoMensual({ datos, meta }: { datos: RecaudoMes[]; meta: number }) {
  const [activo, setActivo] = useState<string | null>(null)
  const maximo = Math.max(...datos.map((d) => d.valor), meta) * 1.1

  return (
    <Card className="gap-4 px-[19px] py-[17px]">
      <CardHeader
        titulo="Recaudo de los últimos 6 meses"
        subtitulo={`Comparado contra la meta mensual de ${formatearMoneda(meta)}`}
      />

      <div className="relative flex h-[168px] items-end gap-3">
        {/* Línea de meta */}
        <div
          className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-border-strong"
          style={{ bottom: `${(meta / maximo) * 100}%` }}
        >
          <span className="absolute -top-4 right-0 rounded-[5px] bg-surface-muted px-1.5 py-px font-mono text-[10px] font-medium text-fg-subtle">
            META
          </span>
        </div>

        {datos.map((punto) => {
          const alcanzada = punto.valor >= meta
          return (
            <div
              key={punto.mes}
              className="relative flex flex-1 cursor-default flex-col items-center justify-end gap-2"
              onPointerEnter={() => setActivo(punto.mes)}
              onPointerLeave={() => setActivo(null)}
              onFocus={() => setActivo(punto.mes)}
              onBlur={() => setActivo(null)}
              tabIndex={0}
            >
              {activo === punto.mes && (
                <div
                  role="status"
                  className="pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-[8px] border border-border-base bg-surface px-2.5 py-1.5 text-[11.5px] shadow-md"
                >
                  <span className="font-semibold text-fg">{formatearMoneda(punto.valor)}</span>
                  <span className="ml-2 text-fg-muted">
                    {Math.round((punto.valor / meta) * 100)} % de la meta
                  </span>
                </div>
              )}

              <div
                className="w-full rounded-t-[6px] transition-opacity"
                style={{
                  height: `${(punto.valor / maximo) * 140}px`,
                  background: alcanzada
                    ? 'var(--rvr-estado-completada)'
                    : 'var(--rvr-cat-1)',
                  opacity: activo && activo !== punto.mes ? 0.5 : 1,
                }}
              />
              <span className="font-mono text-[10px] font-medium text-fg-faint">
                {etiquetaMes(punto.mes)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="sr-only">
        <table>
          <caption>Recaudo mensual frente a la meta</caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Recaudo</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d) => (
              <tr key={d.mes}>
                <th scope="row">{d.mes}</th>
                <td>{d.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
