import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { IconCalendario, IconOrdenes } from '@shared/components/icons'
import { Alert, Skeleton } from '@shared/components/ui'
import { ESTADO_ORDEN_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { cn } from '@shared/lib/cn'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { horaDe } from '@shared/lib/fechas'
import { varsCss } from '@shared/lib/varsCss'
import { portalService, type MiOrden } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'
import { cuantoFalta, EstadoVacio, RecorridoOrden } from '../components/kit'

type Filtro = 'activas' | 'finalizadas' | 'todas'
const ACTIVAS: MiOrden['estado'][] = ['esperando_anticipo', 'en_proceso', 'en_espera_repuesto']

/**
 * HU_82 · Consultar mis órdenes de servicio: solo las del cliente (CA_82_01),
 * con código, servicios, estado y fecha de la visita (CA_82_02).
 */
export default function MisOrdenesPage() {
  const cargar = useCallback(() => portalService.ordenes(), [])
  const { datos, error } = useRecurso(cargar, 0)
  const activas = datos?.filter((o) => ACTIVAS.includes(o.estado)) ?? []
  const [filtro, setFiltro] = useState<Filtro | null>(null)
  const elegido: Filtro = filtro ?? (activas.length ? 'activas' : 'todas')

  const lista = useMemo(
    () => (datos ?? []).filter((o) => (elegido === 'todas' ? true : elegido === 'activas' ? ACTIVAS.includes(o.estado) : !ACTIVAS.includes(o.estado))),
    [datos, elegido],
  )
  const opciones: { valor: Filtro; label: string; n: number }[] = [
    { valor: 'activas', label: 'En curso', n: activas.length },
    { valor: 'finalizadas', label: 'Terminadas', n: (datos?.length ?? 0) - activas.length },
    { valor: 'todas', label: 'Todas', n: datos?.length ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal eyebrow="Seguimiento" titulo="Mis órdenes de servicio" descripcion="En qué va cada servicio, cuándo es la visita y cuánto queda por pagar." />
      {error && <Alert tone="danger" title="No pudimos cargar tus órdenes" description={error} />}
      {!datos && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-[24px]" />)}
      {datos?.length === 0 && (
        <EstadoVacio icono={IconOrdenes} titulo="Aún no tienes órdenes" texto="Las órdenes nacen cuando apruebas una cotización. Desde aquí verás la visita, el avance y los pagos." accion={{ a: ROUTES.portalCatalogo, texto: 'Solicitar un servicio' }} />
      )}

      {!!datos?.length && (
        <>
          <div role="tablist" aria-label="Filtrar órdenes" className="vidrio flex w-fit gap-1 rounded-[16px] border border-[var(--rvr-glass-borde)] p-1">
            {opciones.map((o) => (
              <button key={o.valor} type="button" role="tab" aria-selected={elegido === o.valor} onClick={() => setFiltro(o.valor)}
                className={cn('flex cursor-pointer items-center gap-1.5 rounded-[12px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
                  elegido === o.valor ? 'bg-primary text-white shadow-[0_6px_14px_-8px_var(--rvr-halo-primary)]' : 'text-fg-muted hover:text-fg')}>
                {o.label}
                <span className={cn('rounded-full px-1.5 text-[12px]', elegido === o.valor ? 'bg-white/20' : 'bg-surface-muted')}>{o.n}</span>
              </button>
            ))}
          </div>

          {lista.length === 0 && <p className="m-0 rounded-[20px] border border-dashed border-border-strong p-8 text-center text-[13.5px] text-fg-muted">No hay órdenes en este grupo.</p>}
          <ul className="m-0 grid list-none gap-3.5 p-0 lg:grid-cols-2">
            {lista.map((o, i) => {
              const activa = ACTIVAS.includes(o.estado)
              return (
                <li key={o.id} className="anim-entrada" style={varsCss({ '--retraso': `${Math.min(i, 8) * 50}ms` })}>
                  <Link to={DETALLE.portalOrden(o.id)}
                    className={cn('vidrio tarjeta-viva reflejo flex h-full flex-col gap-4 rounded-[24px] border p-5', activa ? 'border-[var(--rvr-ring-border)]' : 'border-[var(--rvr-glass-borde)]')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn('flex size-11 flex-none items-center justify-center rounded-[14px] text-white', activa ? 'bg-primary' : 'bg-ink dark:bg-[#2b3d5c]')}>
                          <IconOrdenes width="19" height="19" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-[15px] font-bold text-fg">{o.codigo}</span>
                          <span className="block text-[12px] text-fg-subtle">Creada el {formatearFecha(o.fecha)}</span>
                        </span>
                      </div>
                      <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} />
                    </div>
                    <p className="m-0 line-clamp-2 text-[14.5px] leading-snug font-semibold text-fg">{o.servicios}</p>
                    <RecorridoOrden estado={o.estado} grande />
                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-base pt-3.5 text-[13px]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 font-medium text-fg-muted">
                        <IconCalendario width="14" height="14" />
                        {o.fechaVisita ? `${activa ? cuantoFalta(o.fechaVisita) + ' · ' : ''}${formatearFecha(o.fechaVisita)} ${horaDe(o.fechaVisita)}` : 'Visita por agendar'}
                      </span>
                      {o.saldo !== null && o.saldo > 0 ? (
                        <span className="ml-auto rounded-full bg-warning-soft px-3 py-1.5 font-semibold text-warning-fg">Saldo {formatearMoneda(o.saldo)}</span>
                      ) : (
                        o.saldo === 0 && <span className="ml-auto rounded-full bg-[var(--rvr-estado-completada-soft)] px-3 py-1.5 font-semibold text-[var(--rvr-estado-completada-fg)]">Pagada</span>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
