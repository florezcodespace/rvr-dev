import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { IconCotizaciones, IconMas } from '@shared/components/icons'
import { Alert, Skeleton } from '@shared/components/ui'
import { ESTADO_COTIZACION_META, type EstadoCotizacion } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { cn } from '@shared/lib/cn'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { varsCss } from '@shared/lib/varsCss'
import { portalService, type MiCotizacion } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'
import { EstadoVacio } from '../components/kit'

type Filtro = 'todas' | EstadoCotizacion

/** Tres pasos de una cotización: solicitada → valorada por RvR → decidida. */
function pasosDe(c: MiCotizacion) {
  const valorada = c.estado !== 'solicitada'
  const decidida = c.estado === 'aprobada' || c.estado === 'rechazada'
  return [true, valorada, decidida]
}

/**
 * HU_79 · Consultar mis cotizaciones: solo las del cliente (CA_79_01), con
 * número, fecha, estado y monto cuando ya está valorada (CA_79_02). Se ve bien
 * en celular y escritorio (CA_79_05).
 */
export default function MisCotizacionesPage() {
  const cargar = useCallback(() => portalService.cotizaciones(), [])
  const { datos, error } = useRecurso(cargar, 0)
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const porDecidir = datos?.filter((c) => c.estado === 'pendiente') ?? []
  const lista = useMemo(() => (datos ?? []).filter((c) => (filtro === 'todas' ? c.estado !== 'pendiente' : c.estado === filtro)), [datos, filtro])
  const conteo = (e: EstadoCotizacion) => datos?.filter((c) => c.estado === e).length ?? 0
  const opciones: { valor: Filtro; label: string; n?: number }[] = [
    { valor: 'todas', label: 'Historial', n: (datos?.length ?? 0) - porDecidir.length },
    { valor: 'solicitada', label: 'En valoración', n: conteo('solicitada') },
    { valor: 'aprobada', label: 'Aprobadas', n: conteo('aprobada') },
    { valor: 'rechazada', label: 'Rechazadas', n: conteo('rechazada') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal
        eyebrow="Cotizaciones"
        titulo="Mis cotizaciones"
        descripcion="Tus solicitudes y las propuestas que te envía RvR. Nada se cobra hasta que apruebas."
        acciones={<Link to={ROUTES.portalCatalogo} className="pintura-boton boton-liquido inline-flex h-11 items-center gap-2 rounded-[14px] px-5 text-[14px] font-semibold"><IconMas width="16" height="16" /> Nueva solicitud</Link>}
      />
      {error && <Alert tone="danger" title="No pudimos cargar tus cotizaciones" description={error} />}
      {!datos && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[22px]" />)}

      {datos?.length === 0 && (
        <EstadoVacio icono={IconCotizaciones} titulo="Aún no tienes cotizaciones" texto="Elige en el catálogo lo que necesitas y envía tu solicitud. Te respondemos aquí con el valor detallado." accion={{ a: ROUTES.portalCatalogo, texto: 'Ir al catálogo' }} />
      )}

      {/* Las que esperan decisión van primero y destacadas */}
      {porDecidir.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 flex items-center gap-2 text-[16px] font-bold text-fg">
            <span className="relative flex size-2.5"><span className="anim-latido absolute inset-0 rounded-full bg-[#f59e0b]" /><span className="relative size-2.5 rounded-full bg-[#f59e0b]" /></span>
            Esperan tu decisión
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {porDecidir.map((c, i) => (
              <Link key={c.id} to={DETALLE.portalCotizacion(c.id)}
                className="tarjeta-viva reflejo anim-entrada relative flex flex-col gap-4 overflow-hidden rounded-[24px] border border-[#f59e0b]/40 bg-[var(--rvr-surface)] p-5 shadow-[0_20px_40px_-24px_rgb(245_158_11/0.6)] backdrop-blur-xl"
                style={varsCss({ '--retraso': `${i * 70}ms` })}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[13px] font-semibold text-fg-subtle">{c.numero} · {formatearFecha(c.fecha)}</div>
                    <div className="mt-1 line-clamp-2 text-[16px] leading-snug font-bold text-fg">{c.resumen || `${c.items} servicio(s)`}</div>
                    {c.recotizacion && <div className="mt-1 text-[12.5px] font-semibold text-warning-fg">Repuesto que pidió el técnico</div>}
                  </div>
                  <EstadoBadge meta={ESTADO_COTIZACION_META[c.estado]} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-fg-subtle">Valor total</div>
                    <div className="font-display text-[28px] leading-none font-extrabold tracking-[-0.8px] text-fg">{c.montoTotal !== null ? formatearMoneda(c.montoTotal) : '—'}</div>
                  </div>
                  <span className="pintura-boton boton-liquido inline-flex h-11 items-center rounded-[14px] px-4 text-[14px] font-semibold">Revisar y decidir</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {datos && datos.length > porDecidir.length && (
        <section className="flex flex-col gap-3">
          <div role="tablist" aria-label="Filtrar cotizaciones" className="vidrio flex w-fit max-w-full gap-1 overflow-x-auto rounded-[16px] border border-[var(--rvr-glass-borde)] p-1">
            {opciones.map((o) => (
              <button key={o.valor} type="button" role="tab" aria-selected={filtro === o.valor} onClick={() => setFiltro(o.valor)}
                className={cn('flex flex-none cursor-pointer items-center gap-1.5 rounded-[12px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
                  filtro === o.valor ? 'bg-primary text-white shadow-[0_6px_14px_-8px_var(--rvr-halo-primary)]' : 'text-fg-muted hover:text-fg')}>
                {o.label}
                <span className={cn('rounded-full px-1.5 text-[12px]', filtro === o.valor ? 'bg-white/20' : 'bg-surface-muted')}>{o.n}</span>
              </button>
            ))}
          </div>

          {lista.length === 0 && <p className="m-0 rounded-[20px] border border-dashed border-border-strong p-8 text-center text-[13.5px] text-fg-muted">No hay cotizaciones en este grupo.</p>}
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {lista.map((c, i) => {
              const pasos = pasosDe(c)
              const meta = ESTADO_COTIZACION_META[c.estado]
              return (
                <li key={c.id} className="anim-entrada" style={varsCss({ '--retraso': `${Math.min(i, 8) * 40}ms` })}>
                  <Link to={DETALLE.portalCotizacion(c.id)} className="vidrio tarjeta-viva reflejo flex items-center gap-4 rounded-[22px] border border-[var(--rvr-glass-borde)] p-4">
                    <span className="flex size-12 flex-none flex-col items-center justify-center rounded-[15px] text-white" style={{ background: meta.color }}>
                      <IconCotizaciones width="20" height="20" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[14px] font-bold text-fg">{c.numero}</span>
                        <EstadoBadge meta={meta} />
                      </div>
                      <div className="mt-0.5 truncate text-[13.5px] text-fg-muted">{c.resumen || `${c.items} servicio(s)`}</div>
                      {/* Mini recorrido de la cotización */}
                      <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                        {['Solicitada', 'Valorada', 'Decidida'].map((p, k) => (
                          <span key={p} className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                            <span className={cn('size-2 rounded-full', pasos[k] ? 'bg-primary' : 'bg-[var(--rvr-track)]')} />
                            <span className={pasos[k] ? 'text-fg-muted' : 'text-fg-faint'}>{p}</span>
                            {k < 2 && <span className={cn('h-px w-4', pasos[k + 1] ? 'bg-primary' : 'bg-[var(--rvr-track)]')} />}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[18px] font-extrabold whitespace-nowrap text-fg">{c.montoTotal === null ? 'En valoración' : formatearMoneda(c.montoTotal)}</div>
                      <div className="text-[12px] text-fg-subtle">{formatearFecha(c.fecha)}</div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
