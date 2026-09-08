import { useState } from 'react'
import { ESTADO_ORDEN_META } from '@shared/domain/estadoOrden'
import type { ConteoEstado } from '../types'

const ALTO_MAX = 58

export function OrdenesPorEstado({ datos }: { datos: ConteoEstado[] }) {
  const [activo, setActivo] = useState<string | null>(null)
  const maximo = Math.max(...datos.map((d) => d.cantidad), 1)
  const total = datos.reduce((suma, d) => suma + d.cantidad, 0)

  return (
    <div className="border-t border-border-base pt-3.5">
      <h3 className="mb-3 text-[12.5px] font-bold text-fg">Órdenes por estado</h3>

      <ul className="flex h-24 list-none items-end gap-3.5 p-0">
        {datos.map(({ estado, cantidad }) => {
          const meta = ESTADO_ORDEN_META[estado]
          const alto = Math.max((cantidad / maximo) * ALTO_MAX, 6)
          const porcentaje = Math.round((cantidad / total) * 100)

          return (
            <li
              key={estado}
              className="relative flex flex-1 cursor-default flex-col items-center gap-1.5"
              onPointerEnter={() => setActivo(estado)}
              onPointerLeave={() => setActivo(null)}
              onFocus={() => setActivo(estado)}
              onBlur={() => setActivo(null)}
              tabIndex={0}
            >
              {activo === estado && (
                <div
                  role="status"
                  className="pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-[8px] border border-border-base bg-surface px-2.5 py-1.5 text-[11.5px] shadow-md"
                >
                  <span className="font-semibold text-fg">{meta.label}</span>
                  <span className="ml-2 text-fg-muted">
                    {cantidad} órdenes · {porcentaje} %
                  </span>
                </div>
              )}

              <span className="text-[11px] font-bold text-fg">{cantidad}</span>
              <div
                className="w-full rounded-t-[6px] transition-opacity"
                style={{
                  height: `${alto}px`,
                  background: meta.color,
                  opacity: activo && activo !== estado ? 0.45 : 1,
                }}
              />
              <span className="text-[10px] font-semibold text-fg-subtle">
                {meta.labelCorto}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
