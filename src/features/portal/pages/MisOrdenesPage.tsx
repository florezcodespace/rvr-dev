import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DETALLE } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { Alert, Card, Skeleton } from '@shared/components/ui'
import { ESTADO_ORDEN_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFecha, formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

/**
 * HU_82 · Consultar mis órdenes de servicio: solo las del cliente (CA_82_01),
 * con código, servicios, estado y fecha de la visita (CA_82_02).
 */
export default function MisOrdenesPage() {
  const cargar = useCallback(() => portalService.ordenes(), [])
  const { datos, error } = useRecurso(cargar, 0)

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPortal eyebrow="Seguimiento" titulo="Mis órdenes de servicio" descripcion="En qué va cada servicio, cuándo es la visita y cuánto queda por pagar." />
      {error && <Alert tone="danger" title="No pudimos cargar tus órdenes" description={error} />}
      {!datos && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-[14px]" />)}
      {datos?.length === 0 && (
        <Card className="p-10 text-center text-[13.5px] text-fg-muted">Aún no tienes órdenes. Nacen cuando apruebas una cotización.</Card>
      )}
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {datos?.map((o) => (
          <li key={o.id}>
            <Link to={DETALLE.portalOrden(o.id)} className="group block">
              <Card viva className="p-4 transition-transform group-hover:-translate-y-0.5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[150px_minmax(0,1fr)_auto]">
                <div className="col-start-1 row-start-1">
                  <div className="font-mono whitespace-nowrap text-[14px] font-bold text-fg">{o.codigo}</div>
                  <div className="text-[12px] text-fg-subtle">Creada el {formatearFecha(o.fecha)}</div>
                </div>
                <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <div className="line-clamp-2 text-[13.5px] text-fg sm:line-clamp-1">{o.servicios}</div>
                  <div className="text-[12px] text-fg-subtle">{o.fechaVisita ? `Visita: ${formatearFechaHora(o.fechaVisita)}` : 'Visita por agendar'}</div>
                </div>
                <div className="col-start-2 row-start-1 text-right sm:col-start-3">
                  <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} />
                  {o.saldo !== null && o.saldo > 0 && <div className="mt-1 text-[12px] text-fg-muted">Saldo {formatearMoneda(o.saldo)}</div>}
                </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
