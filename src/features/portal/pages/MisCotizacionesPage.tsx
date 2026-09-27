import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { Alert, Button, Card, Skeleton } from '@shared/components/ui'
import { ESTADO_COTIZACION_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

/**
 * HU_79 · Consultar mis cotizaciones: solo las del cliente (CA_79_01), con
 * número, fecha, estado y monto cuando ya está valorada (CA_79_02). Se ve bien
 * en celular y escritorio (CA_79_05).
 */
export default function MisCotizacionesPage() {
  const cargar = useCallback(() => portalService.cotizaciones(), [])
  const { datos, error } = useRecurso(cargar, 0)

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPortal
        eyebrow="Portal de cotizaciones"
        titulo="Mis cotizaciones"
        descripcion="Tus solicitudes y las propuestas que te envía RvR. Las pendientes esperan tu decisión."
        acciones={<Link to={ROUTES.portalCatalogo}><Button>Nueva solicitud</Button></Link>}
      />
      {error && <Alert tone="danger" title="No pudimos cargar tus cotizaciones" description={error} />}
      {!datos && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-[14px]" />)}
      {datos?.length === 0 && (
        <Card className="items-center gap-3 p-10 text-center">
          <p className="m-0 text-[14px] font-semibold text-fg">Aún no tienes cotizaciones</p>
          <p className="m-0 text-[13px] text-fg-muted">Elige en el catálogo lo que necesitas y envía tu solicitud.</p>
          <Link to={ROUTES.portalCatalogo}><Button>Ver catálogo</Button></Link>
        </Card>
      )}
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {datos?.map((c) => (
          <li key={c.id}>
            <Link to={DETALLE.portalCotizacion(c.id)} className="group block">
              <Card viva className="p-4 transition-transform group-hover:-translate-y-0.5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[130px_minmax(0,1fr)_auto]">
                <div className="col-start-1 row-start-1">
                  <div className="font-mono whitespace-nowrap text-[14px] font-bold text-fg">{c.numero}</div>
                  <div className="text-[12px] text-fg-subtle">{formatearFecha(c.fecha)}</div>
                </div>
                <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <div className="line-clamp-2 text-[13.5px] text-fg sm:line-clamp-1">{c.resumen || `${c.items} ítem(s)`}</div>
                  {c.recotizacion && <div className="text-[11.5px] font-semibold text-warning-fg">Repuesto solicitado por el técnico</div>}
                  {c.estado === 'pendiente' && <div className="text-[11.5px] font-semibold text-primary-on-soft">Esperando tu decisión</div>}
                </div>
                <div className="col-start-2 row-start-1 text-right sm:col-start-3">
                  <div className="font-mono whitespace-nowrap text-[15px] font-bold text-fg">{c.montoTotal === null ? 'En valoración' : formatearMoneda(c.montoTotal)}</div>
                  <EstadoBadge meta={ESTADO_COTIZACION_META[c.estado]} />
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
