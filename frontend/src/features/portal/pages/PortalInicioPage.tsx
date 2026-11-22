import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { CONTACTO } from '@features/landing/datos'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { IconCalendario, IconChevron, IconCotizaciones, IconHistorial, IconOrdenes, IconPagos, IconReloj, IconServicios } from '@shared/components/icons'
import { Alert, Avatar, Skeleton, TextoAnimado } from '@shared/components/ui'
import { CATEGORIAS_SERVICIO, ESTADO_COTIZACION_META, ESTADO_ORDEN_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { cn } from '@shared/lib/cn'
import { formatearFecha, formatearMoneda, saludo } from '@shared/lib/format'
import { horaDe } from '@shared/lib/fechas'
import { varsCss } from '@shared/lib/varsCss'
import { portalService, type MiCotizacion, type MiOrden, type Resumen } from '../api'
import { CATEGORIA_VISUAL, CifraViva, cuantoFalta, EstadoVacio, fechaAmable, HojaCalendario, IconoCategoria, PanelTinta, RecorridoOrden, TituloBloque } from '../components/kit'

const ACTIVAS: MiOrden['estado'][] = ['esperando_anticipo', 'en_proceso', 'en_espera_repuesto']

/** Frase corta con lo que el cliente tiene pendiente, en lenguaje natural. */
function fraseDelDia(r: Resumen): string {
  const partes: string[] = []
  if (r.por_decidir) partes.push(`${r.por_decidir === 1 ? 'una cotización espera' : `${r.por_decidir} cotizaciones esperan`} tu decisión`)
  if (r.proximaVisita) partes.push(`el técnico te visita ${cuantoFalta(r.proximaVisita.fecha).toLowerCase()}`)
  if (r.en_valoracion) partes.push(`estamos valorando ${r.en_valoracion === 1 ? 'una solicitud' : `${r.en_valoracion} solicitudes`}`)
  if (!partes.length) return 'Todo está al día. Cuando necesites algo, solicítalo desde el catálogo.'
  const texto = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}` : partes[0]
  return texto.charAt(0).toUpperCase() + texto.slice(1) + '.'
}

/** Inicio del portal del cliente: lo pendiente, la orden en curso y los atajos. */
export default function PortalInicioPage() {
  const { usuario } = useAuth()
  const cargar = useCallback(() => Promise.all([portalService.resumen(), portalService.cotizaciones(), portalService.ordenes()]), [])
  const { datos, error } = useRecurso(cargar, 0)
  const [r, cotizaciones, ordenes] = datos ?? []

  const enCurso = ordenes?.filter((o) => ACTIVAS.includes(o.estado)) ?? []
  const principal = enCurso[0]
  const porDecidir = cotizaciones?.filter((c) => c.estado === 'pendiente') ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- Bienvenida ---------- */}
      <PanelTinta className="p-6 sm:p-9">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <span className="vidrio-oscuro inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8ec5ff]">
              <span aria-hidden="true" className="anim-latido size-1.5 rounded-full bg-[#22c55e]" />
              Portal del cliente · RvR Tecnologías
            </span>
            <h1 className="mt-4 mb-0 text-[32px] leading-[1.08] font-extrabold tracking-[-1.2px] text-white sm:text-[44px]">
              <TextoAnimado key={usuario?.nombres} texto={usuario?.nombres ? `${saludo()}, ${usuario.nombres}` : 'Tu portal RvR'} paso={55} />
            </h1>
            <p className="anim-entrada mt-3 mb-0 max-w-[520px] text-[15.5px] leading-[1.6] text-[#c6d4e8]" style={varsCss({ '--retraso': '300ms' })}>
              {r ? fraseDelDia(r) : 'Cargando tu resumen…'}
            </p>
            <div className="anim-entrada mt-6 flex flex-wrap gap-3" style={varsCss({ '--retraso': '420ms' })}>
              <Link to={ROUTES.portalCatalogo} className="pintura-boton boton-liquido-claro inline-flex h-12 items-center gap-2 rounded-[16px] px-5 text-[14.5px] font-semibold">
                <IconServicios /> Solicitar un servicio
              </Link>
              <Link to={ROUTES.portalOrdenes} className="vidrio-oscuro pintura-boton inline-flex h-12 items-center gap-2 rounded-[16px] px-5 text-[14.5px] font-semibold text-white hover:bg-white/15">
                Ver mis órdenes
              </Link>
            </div>
          </div>

          {/* Pase de la próxima visita */}
          {r?.proximaVisita ? (
            <Link
              to={DETALLE.portalOrden(r.proximaVisita.ordenId)}
              className="vidrio-oscuro reflejo anim-entrada group flex flex-col gap-4 rounded-[24px] p-5 transition-transform duration-300 hover:-translate-y-1"
              style={varsCss({ '--retraso': '360ms' })}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold tracking-wide text-[#8ec5ff] uppercase">Próxima visita</span>
                <span className="rounded-full bg-[#22c55e]/20 px-2.5 py-1 text-[12px] font-bold text-[#7ee2a0]">{cuantoFalta(r.proximaVisita.fecha)}</span>
              </div>
              <div className="flex items-center gap-4">
                <HojaCalendario fecha={r.proximaVisita.fecha} tamano="lg" oscuro />
                <div className="min-w-0">
                  <div className="text-[19px] leading-tight font-bold text-white">{fechaAmable(r.proximaVisita.fecha)}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[14px] text-[#c6d4e8]">
                    <IconReloj width="15" height="15" /> {horaDe(r.proximaVisita.fecha)}
                  </div>
                </div>
              </div>
              {/* Talón del pase */}
              <div className="flex items-center justify-between gap-3 border-t border-dashed border-white/20 pt-4">
                <span className="flex items-center gap-2.5">
                  <Avatar nombre={r.proximaVisita.tecnico} tamano="lg" />
                  <span>
                    <span className="block text-[12px] text-[#9fb6d6]">Tu técnico</span>
                    <span className="block text-[14px] font-semibold text-white">{r.proximaVisita.tecnico}</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[12px] text-[#9fb6d6]">Orden</span>
                  <span className="block font-mono text-[13.5px] font-semibold text-white">{r.proximaVisita.codigo}</span>
                </span>
              </div>
            </Link>
          ) : (
            r && (
              <div className="vidrio-oscuro anim-entrada flex flex-col items-center gap-2 rounded-[24px] p-6 text-center">
                <IconCalendario width="28" height="28" className="text-[#8ec5ff]" />
                <span className="text-[15px] font-semibold text-white">Sin visitas programadas</span>
                <span className="text-[13px] text-[#c6d4e8]">Cuando apruebes una cotización, aquí verás el día y el técnico.</span>
              </div>
            )
          )}
        </div>
      </PanelTinta>

      {error && <Alert tone="danger" title="No pudimos cargar tu resumen" description={error} />}

      {/* ---------- Indicadores ---------- */}
      {!r && !error && (
        <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px] rounded-[22px]" />)}</div>
      )}
      {r && (
        <div className="escalonado grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          {[
            { t: 'Por decidir', v: r.por_decidir, d: 'cotizaciones esperan tu respuesta', a: ROUTES.portalCotizaciones, icono: IconCotizaciones, fondo: 'bg-[#f59e0b]', alerta: r.por_decidir > 0 },
            { t: 'En valoración', v: r.en_valoracion, d: 'solicitudes que RvR prepara', a: ROUTES.portalCotizaciones, icono: IconHistorial, fondo: 'bg-[#0891b2]', alerta: false },
            { t: 'Órdenes activas', v: r.ordenes_activas, d: `${r.ordenes_finalizadas} finalizada(s) con RvR`, a: ROUTES.portalOrdenes, icono: IconOrdenes, fondo: 'bg-primary', alerta: false },
            { t: 'Saldo pendiente', v: r.saldo, d: 'de tus órdenes vigentes', a: ROUTES.portalOrdenes, icono: IconPagos, fondo: 'bg-ink dark:bg-[#2b3d5c]', alerta: r.saldo > 0, dinero: true },
          ].map((k) => (
            <Link key={k.t} to={k.a} className="vidrio tarjeta-viva reflejo anim-entrada group relative flex flex-col gap-3 rounded-[22px] border border-[var(--rvr-glass-borde)] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className={cn('flex size-10 items-center justify-center rounded-[13px] text-white shadow-[0_8px_18px_-10px_rgb(10_40_100/0.7)]', k.fondo)}>
                  <k.icono width="19" height="19" />
                </span>
                {k.alerta ? (
                  <span className="relative flex size-2.5"><span className="anim-latido absolute inset-0 rounded-full bg-[#f59e0b]" /><span className="relative size-2.5 rounded-full bg-[#f59e0b]" /></span>
                ) : (
                  <IconChevron width="16" height="16" className="-rotate-90 text-fg-faint transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="font-display text-[26px] leading-none font-extrabold tracking-[-0.8px] text-fg sm:text-[32px]">
                <CifraViva valor={k.v} formato={k.dinero ? formatearMoneda : undefined} />
              </div>
              <div>
                <div className="text-[13.5px] font-bold text-fg">{k.t}</div>
                <div className="text-[12.5px] text-fg-subtle">{k.d}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ---------- Orden en curso + por decidir ---------- */}
      {ordenes && cotizaciones && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 font-semibold text-warning-fg">Saldo {formatearMoneda(o.saldo)}</span>
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
                    <Link to={DETALLE.portalCotizacion(c.id)} className="vidrio tarjeta-viva reflejo flex items-center gap-4 rounded-[20px] border border-[var(--rvr-glass-borde)] border-l-4 border-l-[#f59e0b] p-4">
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
                <span className="flex size-12 flex-none items-center justify-center rounded-full bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-fg">Todo al día</span>
                  <span className="block text-[13px] text-fg-muted">No tienes cotizaciones pendientes por decidir.</span>
                </span>
              </div>
            )}

            {/* Ayuda */}
            <div className="mt-1 flex items-center gap-4 rounded-[22px] bg-primary-soft p-5">
              <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-primary text-white">
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                  <IconoCategoria categoria={cat} tamano={42} className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
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
              <span className={cn('z-10 flex size-9 items-center justify-center rounded-[11px] text-white', e.tipo === 'o' ? 'bg-primary' : 'bg-ink dark:bg-[#2b3d5c]')}>
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
