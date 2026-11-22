import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import { ICONOS, NOMBRE_OPCION } from './opciones'
import type { OpcionPago } from './reglas'

interface Opcion {
  valor: OpcionPago
  label: string
  detalle?: string
  icono: ReactNode
}

const GRUPOS: { titulo: string; opciones: Opcion[] }[] = [
  {
    titulo: 'Recomendados',
    opciones: [
      { valor: 'nequi', label: NOMBRE_OPCION.nequi, detalle: 'Desde tu app, con tu celular', icono: ICONOS.nequi },
      { valor: 'pse', label: NOMBRE_OPCION.pse, detalle: 'Débito desde tu cuenta de ahorros o corriente', icono: ICONOS.pse },
    ],
  },
  {
    titulo: 'Tarjetas',
    opciones: [
      { valor: 'credito', label: NOMBRE_OPCION.credito, icono: ICONOS.credito },
      { valor: 'debito', label: NOMBRE_OPCION.debito, icono: ICONOS.debito },
    ],
  },
  {
    titulo: 'Otros medios de pago',
    opciones: [
      { valor: 'daviplata', label: NOMBRE_OPCION.daviplata, icono: ICONOS.daviplata },
      { valor: 'transferencia', label: NOMBRE_OPCION.transferencia, detalle: 'Desde la app o sucursal de tu banco', icono: ICONOS.transferencia },
      { valor: 'efectivo', label: NOMBRE_OPCION.efectivo, icono: ICONOS.efectivo },
    ],
  },
]

/** Paso 1 · «Elige cómo pagar», agrupado como en una pasarela de pago. */
export function ElegirMetodo({ valor, onChange, efectivo = true, error }: {
  valor: OpcionPago | null
  onChange: (o: OpcionPago) => void
  /** En el portal del cliente el efectivo se muestra deshabilitado. */
  efectivo?: boolean
  error?: string
}) {
  return (
    <div className="flex flex-col gap-5" role="radiogroup" aria-label="Elige cómo pagar">
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="flex flex-col gap-2">
          <h3 className="m-0 text-[13px] font-semibold text-fg">{g.titulo}</h3>
          <ul className="m-0 list-none overflow-hidden rounded-[14px] border border-border-base p-0">
            {g.opciones.map((o) => {
              const apagada = o.valor === 'efectivo' && !efectivo
              const elegida = valor === o.valor
              return (
                <li key={o.valor} className="border-b border-border-base last:border-b-0">
                  <label className={cn(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    apagada ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-surface-muted',
                    elegida && 'bg-primary-soft/40',
                  )}>
                    <input type="radio" name="opcion-pago" value={o.valor} checked={elegida} disabled={apagada}
                      onChange={() => onChange(o.valor)} className="size-[18px] flex-none cursor-pointer accent-[var(--rvr-primary)]" />
                    {o.icono}
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[14px] text-fg">{o.label}</span>
                      {(apagada || o.detalle) && <span className="text-[12px] text-fg-subtle">{apagada ? 'No habilitado en este momento.' : o.detalle}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {error && <p className="m-0 text-[12px] text-danger-fg">{error}</p>}
    </div>
  )
}
