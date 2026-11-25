import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { CONTACTO } from '@features/landing/datos'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { IconCalendario, IconCotizaciones, IconHistorial, IconOrdenes, IconServicios } from '@shared/components/icons'
import { Alert, Skeleton } from '@shared/components/ui'
import { CATEGORIAS_SERVICIO, ESTADO_COTIZACION_META, ESTADO_ORDEN_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { cn } from '@shared/lib/cn'
import { formatearFecha, formatearMoneda, saludo } from '@shared/lib/format'
import { horaDe } from '@shared/lib/fechas'
import { varsCss } from '@shared/lib/varsCss'
import { portalService, type MiCotizacion, type MiOrden } from '../api'
import { CATEGORIA_VISUAL, CifraViva, EstadoVacio, fechaAmable, RecorridoOrden, TituloBloque } from '../components/kit'

const ACTIVAS: MiOrden['estado'][] = ['esperando_anticipo', 'en_proceso', 'en_espera_repuesto']

/** Inicio del portal del cliente: lo pendiente, la orden en curso y los atajos. */
export default function PortalInicioPage() {
  const { usuario } = useAuth()
  const cargar = useCallback(() => Promise.all([portalService.resumen(), portalService.cotizaciones(), portalService.ordenes()]), [])
  const { datos, error } = useRecurso(cargar, 0)
  const [r, cotizaciones, ordenes] = datos ?? []

  const enCurso = ordenes?.filter((o) => ACTIVAS.includes(o.estado)) ?? []
  const principal = enCurso[0]
  const porDecidir = cotizaciones?.filter((c) => c.estado === 'pendiente') ?? []

  const anticipo = enCurso.find((o) => o.estado === 'esperando_anticipo' && o.anticipoFaltante > o.enRevision)
  const revision = ordenes?.find((o) => o.enRevision > 0)
  const cotizacion = porDecidir[0]
  const visita = r?.proximaVisita
  const accion = anticipo ? {
    etiqueta: 'Anticipo pendiente', titulo: formatearMoneda(anticipo.anticipoFaltante - anticipo.enRevision),
    detalle: [anticipo.codigo, anticipo.servicios].filter(Boolean).join(' · '),
    boton: 'Ver anticipo', destino: DETALLE.portalOrden(anticipo.id) + '?vista=pagos',
  } : revision ? {
    etiqueta: 'Comprobante en revisión', titulo: formatearMoneda(revision.enRevision),
    detalle: revision.codigo + ' · RvR está verificando tu pago.', boton: 'Consultar estado', destino: DETALLE.portalOrden(revision.id) + '?vista=pagos',
  } : cotizacion ? {
    etiqueta: 'Pendiente de tu decisión', titulo: cotizacion.numero, detalle: cotizacion.resumen,
    boton: 'Revisar cotización', destino: DETALLE.portalCotizacion(cotizacion.id),
  } : visita ? {
    etiqueta: 'Próxima visita', titulo: fechaAmable(visita.fecha), detalle: [horaDe(visita.fecha), visita.tecnico, visita.codigo].join(' · '),
    boton: 'Ver visita', destino: DETALLE.portalOrden(visita.ordenId),
  } : principal ? {
    etiqueta: 'Servicio en curso', titulo: principal.codigo, detalle: principal.servicios, boton: 'Seguir mi orden', destino: DETALLE.portalOrden(principal.id),
  } : {
    etiqueta: 'Servicios RvR', titulo: '¿Qué servicio necesitas?', detalle: 'Consulta el catálogo y solicita una cotización.',
    boton: 'Explorar servicios', destino: ROUTES.portalCatalogo,
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
      <h1 className="m-0 lg:col-span-full text-2xl font-semibold tracking-tight text-fg">{saludo()}{usuario?.nombres && `, ${usuario.nombres}`}</h1>
      {r && <div className="grid gap-4 sm:grid-cols-[1.25fr_1fr] lg:col-span-full xl:col-span-8">
        <section className="rounded-[24px] border border-border-base bg-surface-raised p-5 sm:p-7 shadow-[var(--rvr-shadow-card)]">
          <p className="text-sm font-semibold text-primary-on-soft">{accion.etiqueta}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg">{accion.titulo}</h2>
          <p className="mt-2 text-sm text-fg-muted">{accion.detalle}</p>
          <Link to={accion.destino} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-on-primary">{accion.boton}</Link>
        </section>
        <section className="vidrio rounded-[24px] border border-border-base p-5 sm:p-7">
          <h2 className="text-sm font-semibold text-fg">{visita ? 'Tu agenda' : 'Mis servicios'}</h2>
          <p className="my-3 text-xl font-semibold text-fg">{visita ? fechaAmable(visita.fecha) : `${enCurso.length} en curso`}</p>
          {visita && <p className="mb-3 text-sm text-fg-muted">{horaDe(visita.fecha)} · {visita.tecnico}</p>}
          <Link to={visita ? DETALLE.portalOrden(visita.ordenId) : ROUTES.portalOrdenes} className="font-semibold text-link">{visita ? 'Ver detalles de la visita' : 'Consultar mis órdenes'}</Link>
        </section>
      </div>}
      {error && <Alert tone="danger" title="No pudimos cargar tu resumen" description={error} />}

      {/* ---------- Indicadores ---------- */}
      {!r && !error && (
        <div role="status" aria-label="Cargando indicadores" className="grid grid-cols-2 gap-2 lg:col-span-full lg:grid-cols-4 xl:col-span-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="vidrio flex flex-col gap-3 rounded-[22px] border border-[var(--rvr-glass-borde)] p-4 sm:p-5">

              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}
      {r && (
        <div className="grid grid-cols-2 gap-2 lg:col-span-full lg:grid-cols-4 xl:col-span-4 xl:grid-cols-2">
          {[
            { t: 'Cotizaciones por decidir', v: r.por_decidir, a: ROUTES.portalCotizaciones },
            { t: 'En valoración', v: r.en_valoracion, a: ROUTES.portalCotizaciones },
            { t: 'Órdenes activas', v: r.ordenes_activas, a: ROUTES.portalOrdenes },
            { t: 'Saldo pendiente', v: r.saldo, a: ROUTES.portalOrdenes, dinero: true },
          ].map((k) => (
            <Link key={k.t} to={k.a} className="flex min-w-0 flex-col justify-center gap-2 rounded-2xl border border-border-base bg-surface-raised px-4 py-3 transition-colors hover:bg-surface-muted">
              <span className="text-[13px] font-medium text-fg-muted">{k.t}</span>
              <strong className="font-display text-xl leading-tight tracking-tight text-fg sm:text-2xl">
                <CifraViva valor={k.v} formato={k.dinero ? formatearMoneda : undefined} />
              </strong>
            </Link>
          ))}
        </div>
      )}

      {/* ---------- Orden en curso + por decidir ---------- */}
      {ordenes && cotizaciones && (
        <div className="grid gap-5 lg:col-span-full lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section className="flex min-w-0 flex-col gap-3">
            <TituloBloque icono={IconOrdenes} titulo={enCurso.length > 1 ? `Tus órdenes en curso (${enCurso.length})` : 'Tu orden en curso'}
              accion={<Link to={ROUTES.portalOrdenes} className="text-[13px] font-semibold text-link hover:underline">Ver todas</Link>} />
            {principal ? (
              <div className="flex flex-col gap-3">
                {enCurso.slice(0, 2).map((o, i) => (
                  <Link key={o.id} to={DETALLE.portalOrden(o.id)}
                    className={cn('vidrio tarjeta-viva reflejo anim-entrada flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5', i === 0 && 'ring-1 ring-[var(--rvr-ring-border)]')}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-[13px] font-semibold text-fg-subtle">{o.codigo}</div>
                        <div className="mt-0.5 line-clamp-2 text-[16px] leading-snug font-bold text-fg">{o.servicios}</div>
                      </div>
                      <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} />
                    </div>
                    <RecorridoOrden estado={o.estado} grande />
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 font-medium text-fg-muted">
                        <IconCalendario width="14" height="14" />
                        {o.fechaVisita ? `Visita ${formatearFecha(o.fechaVisita)} · ${horaDe(o.fechaVisita)}` : 'Visita por agendar'}
                      </span>
                      {o.saldo !== null && o.saldo > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 font-semibold text-fg-muted">Saldo {formatearMoneda(o.saldo)}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EstadoVacio icono={IconOrdenes} titulo="No tienes órdenes en curso" texto="Las órdenes nacen cuando apruebas una cotización. Aquí verás en qué va cada servicio." accion={{ a: ROUTES.portalCatalogo, texto: 'Solicitar un servicio' }} />
            )}
          </section>

          <section className="flex min-w-0 flex-col gap-3">
            <TituloBloque icono={IconCotizaciones} titulo="Esperan tu decisión"
              accion={<Link to={ROUTES.portalCotizaciones} className="text-[13px] font-semibold text-link hover:underline">Cotizaciones</Link>} />
            {porDecidir.length ? (
              <ul className="escalonado m-0 flex list-none flex-col gap-2.5 p-0">
                {porDecidir.slice(0, 3).map((c) => (
                  <li key={c.id} className="anim-entrada">
                    <Link to={DETALLE.portalCotizacion(c.id)} className="vidrio tarjeta-viva reflejo flex items-center gap-4 rounded-[20px] border border-[var(--rvr-glass-borde)]  p-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[12.5px] font-semibold text-fg-subtle">{c.numero}</div>
                        <div className="line-clamp-1 text-[14px] font-semibold text-fg">{c.resumen || `${c.items} servicio(s)`}</div>
                        {c.recotizacion && <div className="text-[12px] font-semibold text-warning-fg">Repuesto que pidió el técnico</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-display text-[19px] font-extrabold whitespace-nowrap text-fg">{c.montoTotal !== null ? formatearMoneda(c.montoTotal) : '—'}</div>
                        <div className="text-[12.5px] font-semibold text-link">Revisar →</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="vidrio flex items-center gap-4 rounded-[22px] border border-[var(--rvr-glass-borde)] p-5">
                <span className="flex size-12 flex-none items-center justify-center rounded-full bg-surface-muted text-fg-muted">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-fg">Todo al día</span>
                  <span className="block text-[13px] text-fg-muted">No tienes cotizaciones pendientes por decidir.</span>
                </span>
              </div>
            )}

            {/* Ayuda */}
            <div className="mt-1 flex items-center gap-4 rounded-[22px] border border-border-base bg-surface-raised p-5">
              <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-surface-muted text-fg-muted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-fg">¿Necesitas ayuda?</span>
                <span className="block text-[13px] text-fg-muted">Llámanos o escríbenos al <a href={CONTACTO.telefonoHref} className="font-semibold text-link">{CONTACTO.telefono}</a></span>
              </span>
            </div>
          </section>
        </div>
      )}

      {/* ---------- Actividad + explorar ---------- */}
      {ordenes && cotizaciones && (
        <div className="grid gap-5 lg:col-span-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="flex min-w-0 flex-col gap-3">
            <TituloBloque icono={IconHistorial} titulo="Actividad reciente" />
            <Actividad cotizaciones={cotizaciones} ordenes={ordenes} />
          </section>
          <section className="flex min-w-0 flex-col gap-3">
            <TituloBloque icono={IconServicios} titulo="¿Qué necesitas hoy?"
              accion={<Link to={ROUTES.portalCatalogo} className="text-[13px] font-semibold text-link hover:underline">Ver catálogo</Link>} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {CATEGORIAS_SERVICIO.map((cat, i) => (
                <Link key={cat} to={`${ROUTES.portalCatalogo}?categoria=${encodeURIComponent(cat)}`}
                  className="vidrio tarjeta-viva reflejo anim-entrada group flex flex-col gap-3 rounded-[20px] border border-[var(--rvr-glass-borde)] p-4"
                  style={varsCss({ '--retraso': `${i * 60}ms` })}>
                  <span className="text-[14px] font-bold text-fg">{CATEGORIA_VISUAL[cat].corto}</span>
                </Link>
              ))}
              <Link to={ROUTES.portalSolicitar} className="flex flex-col justify-between gap-3 rounded-[20px] border border-dashed border-border-strong p-4 text-fg-muted transition-colors hover:border-[var(--rvr-ring-border)] hover:text-fg">
                <span className="text-[22px] leading-none">→</span>
                <span className="text-[13.5px] font-semibold">Mi solicitud</span>
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

/** Línea de tiempo con los últimos movimientos de cotizaciones y órdenes. */
function Actividad({ cotizaciones, ordenes }: { cotizaciones: MiCotizacion[]; ordenes: MiOrden[] }) {
  const eventos = [
    ...cotizaciones.map((c) => ({ id: `c${c.id}`, fecha: c.fecha, titulo: `Cotización ${c.numero}`, texto: c.resumen || `${c.items} servicio(s)`, meta: ESTADO_COTIZACION_META[c.estado], a: DETALLE.portalCotizacion(c.id), tipo: 'c' as const })),
    ...ordenes.map((o) => ({ id: `o${o.id}`, fecha: o.fecha, titulo: `Orden ${o.codigo}`, texto: o.servicios, meta: ESTADO_ORDEN_META[o.estado], a: DETALLE.portalOrden(o.id), tipo: 'o' as const })),
  ]
    .sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha))
    .slice(0, 6)

  if (!eventos.length) return <div className="vidrio rounded-[22px] border border-[var(--rvr-glass-borde)] p-6 text-center text-[13.5px] text-fg-muted">Aquí aparecerá lo que pase con tus solicitudes y órdenes.</div>

  return (
    <ol className="vidrio m-0 flex list-none flex-col rounded-[22px] border border-[var(--rvr-glass-borde)] p-2">
      {eventos.map((e, i) => (
        <li key={e.id} className="anim-entrada" style={varsCss({ '--retraso': `${i * 50}ms` })}>
          <Link to={e.a} className="group flex items-center gap-3.5 rounded-[16px] px-3 py-3 transition-colors hover:bg-surface-muted">
            <span className="relative flex flex-col items-center self-stretch">
              <span className="z-10 flex size-9 items-center justify-center rounded-[11px] bg-surface-muted text-fg-muted">
                {e.tipo === 'o' ? <IconOrdenes width="16" height="16" /> : <IconCotizaciones width="16" height="16" />}
              </span>
              {i < eventos.length - 1 && <span aria-hidden="true" className="absolute top-9 -bottom-3 w-px bg-border-base" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[13.5px] font-bold text-fg">{e.titulo}</span>
                <EstadoBadge meta={e.meta} />
              </span>
              <span className="block truncate text-[12.5px] text-fg-muted">{e.texto}</span>
            </span>
            <span className="hidden text-[12px] whitespace-nowrap text-fg-subtle sm:block">{formatearFecha(e.fecha)}</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
