import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { Volver } from '@shared/components/detalle'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { IconCheck, IconX } from '@shared/components/icons'
import { Alert, Button, Card, SkeletonKpis } from '@shared/components/ui'
import { ESTADO_COTIZACION_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { cn } from '@shared/lib/cn'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

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

  return (
    <div className="flex flex-col gap-5">
      <Volver a={ROUTES.portalCotizaciones} texto="Mis cotizaciones" />
      <EncabezadoPortal
        eyebrow={c.ordenOrigen ? `Repuesto para la orden ${c.ordenOrigen.codigo}` : 'Cotización'}
        titulo={`Cotización ${c.numero}`}
        descripcion={<span className="inline-flex items-center gap-2">Solicitada el {formatearFechaHora(c.fecha)} · <EstadoBadge meta={ESTADO_COTIZACION_META[c.estado]} /></span>}
        acciones={c.estado === 'pendiente' && (
          <>
            <Button variant="secondary" leadingIcon={<IconX />} onClick={() => setDecision('rechazada')}>Rechazar</Button>
            <Button leadingIcon={<IconCheck />} onClick={() => setDecision('aprobada')}>Aprobar cotización</Button>
          </>
        )}
      />

      {c.estado === 'solicitada' && <Alert tone="info" title="Estamos valorando tu solicitud" description="Te avisaremos aquí cuando la cotización esté lista." />}
      {c.estado === 'pendiente' && <Alert tone="warning" title="Esta cotización espera tu decisión" description="Revisa los servicios y el valor. Si la apruebas, RvR crea tu orden de servicio y te contacta para agendar la visita." />}
      {c.estado === 'aprobada' && (
        <Alert tone="success" title="Aprobaste esta cotización"
          description={c.orden ? <Link to={DETALLE.portalOrden(c.orden.id)} className="font-semibold text-link underline">Ver tu orden {c.orden.codigo}</Link> : 'RvR generará tu orden de servicio en breve.'} />
      )}
      {c.estado === 'rechazada' && <Alert tone="danger" title="Rechazaste esta cotización" description={c.motivoRechazo ? `Motivo: ${c.motivoRechazo}` : undefined} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border-base px-5 py-3.5 text-[14px] font-bold text-fg">Detalle</div>
          <ul className="m-0 list-none p-0">
            {c.detalle.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 border-b border-border-base px-5 py-3.5 last:border-b-0">
                <span className={cn('rounded-[6px] px-1.5 py-px text-[10px] font-bold uppercase', i.tipo === 'servicio' ? 'bg-primary-soft text-primary-on-soft' : 'bg-warning-soft text-warning-fg')}>{i.tipo}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-fg">{i.nombre}</span>
                  <span className="block text-[12px] text-fg-subtle">
                    {i.cantidad} × {i.precioUnitario === null ? 'por valorar' : formatearMoneda(i.precioUnitario)}
                  </span>
                </span>
                <span className="font-mono whitespace-nowrap text-[14px] font-semibold text-fg">{i.subtotal === null ? '—' : formatearMoneda(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t-2 border-border-strong px-5 py-4">
            <span className="text-[13.5px] font-semibold text-fg">Total</span>
            <span className="font-mono whitespace-nowrap text-[20px] font-bold text-fg">{c.montoTotal === null ? 'En valoración' : formatearMoneda(c.montoTotal)}</span>
          </div>
        </Card>
        <Card className="h-fit gap-3 p-5 text-[13px]">
          <div className="text-[14px] font-bold text-fg">Tu solicitud</div>
          <div><div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Problema</div><p className="m-0 mt-0.5 text-fg">{c.descripcion || '—'}</p></div>
          <div><div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Dirección</div><p className="m-0 mt-0.5 text-fg">{c.direccion || '—'}</p></div>
          <div><div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Enviada por RvR</div><p className="m-0 mt-0.5 text-fg">{c.fechaEnvio ? formatearFechaHora(c.fechaEnvio) : 'Aún no'}</p></div>
          {c.fechaRespuesta && <div><div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Tu respuesta</div><p className="m-0 mt-0.5 text-fg">{formatearFechaHora(c.fechaRespuesta)}</p></div>}
        </Card>
      </div>

      <ConfirmarAccion
        abierto={decision === 'aprobada'}
        titulo="¿Aprobar la cotización?"
        descripcion={`Autorizas el servicio por ${c.montoTotal !== null ? formatearMoneda(c.montoTotal) : ''}. Para iniciar se requiere un anticipo del 50 %. Una vez aprobada no se puede cambiar.`}
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
