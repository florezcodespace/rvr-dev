import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { IconCalendario, IconCotizaciones, IconOrdenes, IconServicios } from '@shared/components/icons'
import { Alert, Button, Card, SkeletonKpis } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFechaLarga, formatearMoneda, saludo } from '@shared/lib/format'
import { horaDe } from '@shared/lib/fechas'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

/** Inicio del portal del cliente: lo pendiente y los accesos a sus historias. */
export default function PortalInicioPage() {
  const { usuario } = useAuth()
  const cargar = useCallback(() => portalService.resumen(), [])
  const { datos: r, error } = useRecurso(cargar, 0)

  const tarjetas = r && [
    { t: 'Cotizaciones por decidir', v: r.por_decidir, d: 'Revísalas y apruébalas o recházalas', a: ROUTES.portalCotizaciones, i: IconCotizaciones, alerta: r.por_decidir > 0 },
    { t: 'Solicitudes en valoración', v: r.en_valoracion, d: 'RvR está preparando tu cotización', a: ROUTES.portalCotizaciones, i: IconCotizaciones, alerta: false },
    { t: 'Órdenes activas', v: r.ordenes_activas, d: `${r.ordenes_finalizadas} finalizada(s)`, a: ROUTES.portalOrdenes, i: IconOrdenes, alerta: false },
    { t: 'Saldo pendiente', v: formatearMoneda(r.saldo), d: 'De tus órdenes vigentes', a: ROUTES.portalOrdenes, i: IconOrdenes, alerta: r.saldo > 0 },
  ]

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPortal
        eyebrow={`${saludo()}, ${usuario?.nombres ?? ''}`}
        titulo="Tu portal RvR"
        descripcion="Solicita servicios, aprueba cotizaciones y sigue tus órdenes sin llamar ni escribir por WhatsApp."
        acciones={<Link to={ROUTES.portalCatalogo}><Button leadingIcon={<IconServicios />}>Solicitar un servicio</Button></Link>}
      />
      {error && <Alert tone="danger" title="No pudimos cargar tu resumen" description={error} />}
      {!r && !error && <SkeletonKpis />}
      {r?.proximaVisita && (
        <Card className="flex-row flex-wrap items-center gap-4 border-[var(--rvr-ring-border)] bg-primary-soft p-5">
          <span className="flex size-11 items-center justify-center rounded-[12px] bg-primary text-on-primary"><IconCalendario /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-primary-on-soft uppercase">Próxima visita</div>
            <div className="text-[16px] font-bold text-fg">{formatearFechaLarga(r.proximaVisita.fecha)} · {horaDe(r.proximaVisita.fecha)}</div>
            <div className="text-[13px] text-fg-muted">Técnico: {r.proximaVisita.tecnico} · orden <span className="font-mono">{r.proximaVisita.codigo}</span></div>
          </div>
          <Link to={DETALLE.portalOrden(r.proximaVisita.ordenId)}><Button variant="secondary">Ver la orden</Button></Link>
        </Card>
      )}
      {tarjetas && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {tarjetas.map((t) => (
            <Link key={t.t} to={t.a} className="group">
              <Card viva className="h-full gap-2 p-5 transition-transform group-hover:-translate-y-0.5">
                <span className={t.alerta ? 'flex size-9 items-center justify-center rounded-[10px] bg-warning-soft text-warning-fg' : 'flex size-9 items-center justify-center rounded-[10px] bg-surface-muted text-fg-subtle'}><t.i /></span>
                <div className="text-[12.5px] font-semibold text-fg-muted">{t.t}</div>
                <div className="text-[26px] font-bold tracking-[-0.5px] text-fg">{t.v}</div>
                <div className="text-[12px] text-fg-subtle">{t.d}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Card className="gap-3 p-5">
        <div className="text-[15px] font-bold text-fg">¿Cómo funciona?</div>
        <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['1', 'Solicita', 'Elige los servicios del catálogo y cuéntanos el problema.'],
            ['2', 'Aprueba', 'Recibes la cotización aquí y la apruebas o la rechazas.'],
            ['3', 'Agenda y paga el anticipo', 'Con el 50 % programamos la visita del técnico.'],
            ['4', 'Sigue tu orden', 'Ves la visita, el estado, el pago y la solución aplicada.'],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-3 rounded-[12px] border border-border-base p-3.5">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-primary text-[12px] font-bold text-on-primary">{n}</span>
              <span><span className="block text-[13px] font-semibold text-fg">{t}</span><span className="block text-[12px] text-fg-muted">{d}</span></span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
