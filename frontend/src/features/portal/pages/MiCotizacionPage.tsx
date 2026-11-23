import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { Volver } from '@shared/components/detalle'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { IconCheck, IconConfiguracion, IconOrdenes, IconX } from '@shared/components/icons'
import { Alert, Button, SkeletonKpis } from '@shared/components/ui'
import { ESTADO_COTIZACION_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { cn } from '@shared/lib/cn'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { CifraViva, IconoCategoria, PanelTinta, SobreOscuro } from '../components/kit'

/**
 * HU_79 detalle con servicios y repuestos (CA_79_03) · HU_80 Aprobar o rechazar
 * mi cotización: solo pendientes (CA_80_01), con confirmación (CA_80_02), motivo
 * del rechazo (CA_80_04) y sin poder cambiar la decisión (CA_80_05).
 */
export default function MiCotizacionPage() {
  const id = Number(useParams().id)
  const { mostrar } = useToast()
  const cargar = useCallback((cid: number) => portalService.cotizacion(cid), [])
  const { datos: c, error, recargar } = useRecurso(cargar, id)
  const [decision, setDecision] = useState<'aprobada' | 'rechazada' | null>(null)

  if (error) return <Alert tone="danger" title="No encontramos esa cotización" description={error} />
  if (!c) return <SkeletonKpis />

  const total = c.montoTotal ?? 0
  const anticipo = Math.round(total / 2)
  const pendiente = c.estado === 'pendiente'
  const pasos = [
    { t: 'Solicitaste', f: c.fecha, hecho: true },
    { t: 'RvR la valoró', f: c.fechaEnvio, hecho: c.estado !== 'solicitada' },
    { t: c.estado === 'rechazada' ? 'La rechazaste' : c.estado === 'aprobada' ? 'La aprobaste' : 'Tu decisión', f: c.fechaRespuesta, hecho: c.estado === 'aprobada' || c.estado === 'rechazada' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Volver a={ROUTES.portalCotizaciones} texto="Mis cotizaciones" />

      {/* ---------- Encabezado ---------- */}
      <PanelTinta className="p-6 sm:p-8" intensidad={0.62}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="vidrio-oscuro rounded-full px-3 py-1 text-[12.5px] font-semibold text-[#8ec5ff]">
                {c.ordenOrigen ? `Repuesto para la orden ${c.ordenOrigen.codigo}` : 'Cotización'}
              </span>
              <SobreOscuro><EstadoBadge meta={ESTADO_COTIZACION_META[c.estado]} /></SobreOscuro>
            </div>
            <h1 className="mt-3 mb-0 font-mono text-[30px] leading-none font-bold tracking-[-0.5px] text-white sm:text-[38px]">{c.numero}</h1>
            <p className="mt-2 text-sm text-white">Titular: {c.cliente.nombre} · {c.cliente.tipoDocumento} {c.cliente.documento}</p>
            {/* Recorrido de la cotización */}
            <ol className="m-0 mt-6 grid max-w-[560px] list-none grid-cols-3 gap-2 p-0">
              {pasos.map((p) => (
                <li key={p.t} className="flex flex-col gap-1.5">
                  <span className={cn('h-1.5 rounded-full', p.hecho ? 'bg-[#1e88ff]' : 'bg-white/15')} />
                  <span className={cn('text-[12.5px] font-semibold', p.hecho ? 'text-white' : 'text-white/45')}>{p.t}</span>
                  <span className="text-[11.5px] text-[#9fb6d6]">{p.f ? formatearFechaHora(p.f) : '—'}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:text-right">
            <div className="text-[13px] font-semibold text-[#9fb6d6]">Valor total</div>
            <div className="font-display text-[40px] leading-none font-extrabold tracking-[-1.4px] text-white sm:text-[52px]">
              {c.montoTotal === null ? 'En valoración' : <CifraViva valor={total} formato={formatearMoneda} duracion={900} />}
            </div>
          </div>
        </div>
      </PanelTinta>

      {c.estado === 'solicitada' && <Alert tone="info" title="Estamos valorando tu solicitud" description="Un técnico revisa lo que pediste. Te avisaremos aquí cuando la cotización esté lista." />}
      {c.estado === 'aprobada' && (
        <Alert tone="success" title="Aprobaste esta cotización"
          description={c.orden ? <Link to={DETALLE.portalOrden(c.orden.id)} className="font-semibold text-link underline">Ver tu orden {c.orden.codigo}</Link> : 'RvR generará tu orden de servicio en breve.'} />
      )}
      {c.estado === 'rechazada' && <Alert tone="danger" title="Rechazaste esta cotización" description={c.motivoRechazo ? `Motivo: ${c.motivoRechazo}` : undefined} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------- Detalle ---------- */}
        <section className="vidrio flex flex-col overflow-hidden rounded-[24px] border border-[var(--rvr-glass-borde)]">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h2 className="m-0 text-[16px] font-bold text-fg">Qué incluye</h2>
            <span className="text-[13px] text-fg-subtle">{c.detalle.length} ítem{c.detalle.length === 1 ? '' : 's'}</span>
          </div>
          <ul className="m-0 list-none p-0">
            {c.detalle.map((i) => (
              <li key={i.id} className="flex items-center gap-4 border-b border-border-base px-5 py-4 last:border-b-0">
                {i.tipo === 'servicio' ? (
                  <IconoCategoria categoria={i.categoria} tamano={42} />
                ) : (
                  <span className="flex size-[42px] flex-none items-center justify-center rounded-[13px] bg-[#f59e0b] text-white"><IconConfiguracion width="20" height="20" /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-fg">{i.nombre}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-fg-subtle">
                    <span className={cn('rounded-full px-2 py-px text-[11.5px] font-bold uppercase', i.tipo === 'servicio' ? 'bg-primary-soft text-primary-on-soft' : 'bg-warning-soft text-warning-fg')}>{i.tipo}</span>
                    {i.cantidad} × {i.precioUnitario === null ? 'por valorar' : formatearMoneda(i.precioUnitario)}
                  </span>
                </span>
                <span className="font-display text-[16px] font-extrabold whitespace-nowrap text-fg">{i.subtotal === null ? '—' : formatearMoneda(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-baseline justify-between bg-surface-muted px-5 py-4">
            <span className="text-[14px] font-bold text-fg">Total</span>
            <span className="font-display text-[24px] font-extrabold whitespace-nowrap text-fg">{c.montoTotal === null ? 'En valoración' : formatearMoneda(total)}</span>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          {/* ---------- Decisión ---------- */}
          {pendiente && (
            <section className="vidrio anim-entrada flex flex-col gap-4 rounded-[24px] border-2 border-[var(--rvr-ring-border)] p-5 lg:sticky lg:top-24">
              <div>
                <h2 className="m-0 text-[17px] font-bold text-fg">¿La apruebas?</h2>
                <p className="m-0 mt-1 text-[13.5px] text-fg-muted">Si la apruebas, RvR crea tu orden de servicio y te contacta para agendar la visita.</p>
              </div>
              {/* Cómo se paga: 50 / 50 */}
              <div className="flex flex-col gap-2 rounded-[18px] bg-surface-muted p-4">
                <div className="flex h-2.5 overflow-hidden rounded-full">
                  <span className="w-1/2 bg-primary" />
                  <span className="w-1/2 bg-[var(--rvr-track)]" />
                </div>
                <div className="flex justify-between text-[13px]">
                  <span><span className="block font-semibold text-fg">Anticipo 50 %</span><span className="text-fg-subtle">para agendar</span></span>
                  <span className="font-display text-[16px] font-extrabold text-fg">{formatearMoneda(anticipo)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span><span className="block font-semibold text-fg">Saldo</span><span className="text-fg-subtle">al terminar el servicio</span></span>
                  <span className="font-display text-[16px] font-extrabold text-fg">{formatearMoneda(total - anticipo)}</span>
                </div>
              </div>
              <Button size="lg" fullWidth liquido leadingIcon={<IconCheck />} onClick={() => setDecision('aprobada')}>Aprobar cotización</Button>
              <Button variant="ghost" fullWidth leadingIcon={<IconX />} onClick={() => setDecision('rechazada')}>No por ahora, rechazar</Button>
            </section>
          )}

          {c.estado === 'aprobada' && c.orden && (
            <Link to={DETALLE.portalOrden(c.orden.id)} className="vidrio tarjeta-viva reflejo flex items-center gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
              <span className="flex size-12 items-center justify-center rounded-[15px] bg-primary text-white"><IconOrdenes /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] text-fg-subtle">Tu orden</span>
                <span className="block font-mono text-[16px] font-bold text-fg">{c.orden.codigo}</span>
              </span>
              <span className="text-[13px] font-semibold text-link">Ver →</span>
            </Link>
          )}

          {/* ---------- Tu solicitud ---------- */}
          <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5 text-[13.5px]">
            <h2 className="m-0 text-[16px] font-bold text-fg">Tu solicitud</h2>
            <div className="rounded-[16px] bg-surface-muted p-3.5">
              <div className="text-[12px] font-semibold text-fg-subtle">Lo que nos contaste</div>
              <p className="m-0 mt-1 leading-[1.6] text-fg">{c.descripcion ? `«${c.descripcion}»` : '—'}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-primary-soft text-primary-on-soft">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              </span>
              <span><span className="block text-[12px] font-semibold text-fg-subtle">Dirección del servicio</span><span className="text-fg">{c.direccion || '—'}</span></span>
            </div>
          </section>
        </div>
      </div>

      <ConfirmarAccion
        abierto={decision === 'aprobada'}
        titulo="¿Aprobar la cotización?"
        descripcion={`Autorizas el servicio por ${c.montoTotal !== null ? formatearMoneda(c.montoTotal) : ''}. Para iniciar se requiere un anticipo del 50 % (${formatearMoneda(anticipo)}). Una vez aprobada no se puede cambiar.`}
        textoConfirmar="Sí, aprobar"
        onCerrar={() => setDecision(null)}
        onConfirmar={async () => {
          const r = await portalService.decidir(c.id, 'aprobada', null)
          mostrar({ tono: 'exito', mensaje: r.mensaje })
          recargar()
        }}
      />
      <ConfirmarAccion
        abierto={decision === 'rechazada'}
        titulo="¿Rechazar la cotización?"
        descripcion="No se generará ninguna orden. Una vez rechazada no se puede cambiar."
        textoConfirmar="Sí, rechazar"
        tono="danger"
        pedirMotivo="¿Por qué la rechazas? (opcional)"
        onCerrar={() => setDecision(null)}
        onConfirmar={async (motivo) => {
          const r = await portalService.decidir(c.id, 'rechazada', motivo || null)
          mostrar({ tono: 'exito', mensaje: r.mensaje })
          recargar()
        }}
      />
    </div>
  )
}
