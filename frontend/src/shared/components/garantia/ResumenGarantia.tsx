import { Link } from 'react-router-dom'
import { EstadoBadge } from '@shared/components/data'
import { ESTADO_RECLAMO_META, GARANTIA_VENCIDA_META, GARANTIA_VIGENTE_META } from '@shared/domain/estados'
import type { GarantiaDetalle } from '@shared/domain/garantias'
import { formatearFecha, formatearFechaHora } from '@shared/lib/format'

/**
 * [Feedback 13] Vigencia de la garantía y sus reclamos. Lo usan el portal del
 * cliente, el detalle de la orden y la bandeja de garantías.
 */
export function ResumenGarantia({ g, enlaceOrden }: { g: GarantiaDetalle; enlaceOrden: (id: number) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <EstadoBadge meta={g.vigente ? GARANTIA_VIGENTE_META : GARANTIA_VENCIDA_META} />
        <span className="text-[13px] text-fg">
          {formatearFecha(g.fechaInicio)} – {formatearFecha(g.fechaFin)}
        </span>
        <span className="text-[12px] text-fg-subtle">
          {g.vigente ? (g.diasRestantes === 0 ? 'vence hoy' : `quedan ${g.diasRestantes} día(s)`) : 'ya venció'}
        </span>
      </div>
      {g.historialReclamos.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {g.historialReclamos.map((r) => (
            <li key={r.id} className="rounded-[10px] border border-border-base px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-fg-subtle">Reclamo del {formatearFechaHora(r.fecha)}</span>
                <EstadoBadge meta={ESTADO_RECLAMO_META[r.estado]} />
              </div>
              <p className="m-0 mt-1.5 text-[13px] text-fg">{r.descripcion}</p>
              {r.respuesta && (
                <p className="m-0 mt-2 border-l-2 border-border-strong pl-2.5 text-[13px] text-fg-muted">
                  <b className="font-semibold text-fg">Respuesta de RvR:</b> {r.respuesta}
                </p>
              )}
              {r.ordenGarantia && (
                <Link to={enlaceOrden(r.ordenGarantia.id)} className="mt-2 inline-block font-mono text-[13px] font-semibold text-link hover:underline">
                  Orden de garantía {r.ordenGarantia.codigo} →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
