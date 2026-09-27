import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { Volver } from '@shared/components/detalle'
import { AreaTexto } from '@shared/components/form/Campos'
import { Alert, Button, Card, PageHeader, Skeleton } from '@shared/components/ui'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { ordenesService } from '../api'

type Aprobada = Awaited<ReturnType<typeof ordenesService.cotizacionesAprobadas>>[number]

/**
 * HU_44 · Registrar la orden de servicio a partir de una cotización aprobada
 * (CA_44_01). Solo se listan las aprobadas que aún no tienen orden (CA_44_04).
 */
export default function NuevaOrdenPage() {
  const navigate = useNavigate()
  const { mostrar } = useToast()
  const [aprobadas, setAprobadas] = useState<Aprobada[] | null>(null)
  const [elegida, setElegida] = useState<number | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    ordenesService.cotizacionesAprobadas().then(setAprobadas).catch((e) => setError(mensajeDe(e)))
  }, [])

  const crear = async () => {
    if (!elegida) return setError('Selecciona la cotización aprobada.')
    setGuardando(true)
    setError(null)
    try {
      const o = await ordenesService.registrar(elegida, observaciones.trim() || null)
      mostrar({ tono: 'exito', mensaje: `Orden ${o.codigo} creada: esperando anticipo` })
      navigate(DETALLE.orden(o.id))
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.ordenes} texto="Volver a órdenes" />
      <PageHeader eyebrow="Venta – Órdenes" titulo="Registrar orden de servicio" descripcion="Elige la cotización aprobada: cada servicio y repuesto cotizado se vuelve un ítem de la orden." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="gap-2 p-4">
          <div className="px-1 pb-1 text-[14px] font-bold text-fg">Cotizaciones aprobadas sin orden</div>
          {!aprobadas && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          {aprobadas?.length === 0 && (
            <p className="m-0 rounded-[11px] border border-dashed border-border-strong p-8 text-center text-[13px] text-fg-muted">
              No hay cotizaciones aprobadas pendientes de orden. <Link to={ROUTES.cotizaciones} className="font-semibold text-link underline">Ver cotizaciones</Link>
            </p>
          )}
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {aprobadas?.map((q) => (
              <li key={q.id}>
                <label className={cn('flex cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 transition-colors', elegida === q.id ? 'border-[var(--rvr-ring-border)] bg-primary-soft' : 'border-border-base hover:bg-surface-muted')}>
                  <input type="radio" name="cotizacion" checked={elegida === q.id} onChange={() => setElegida(q.id)} className="accent-[var(--rvr-primary)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-fg"><span className="font-mono">{q.numero}</span> · {q.cliente}</span>
                    <span className="block text-[11.5px] text-fg-subtle">{q.items} ítem(s){q.fechaAprobacion && ` · aprobada el ${formatearFecha(q.fechaAprobacion)}`}</span>
                  </span>
                  <span className="font-mono whitespace-nowrap text-[14px] font-bold text-fg">{formatearMoneda(q.montoTotal)}</span>
                  <Link to={DETALLE.cotizacion(q.id)} className="text-[12px] font-semibold text-link hover:underline" onClick={(e) => e.stopPropagation()}>Ver</Link>
                </label>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-fit gap-3.5 p-5">
          <AreaTexto label="Observaciones iniciales (opcional)" value={observaciones} maxLength={2000} rows={4} onChange={(e) => setObservaciones(e.target.value)} />
          <p className="m-0 text-[11.5px] text-fg-subtle">La orden recibe un código único automático, sus ítems quedan «pendientes» y la orden «esperando anticipo».</p>
          {error && <Alert tone="danger" title="No se creó la orden" description={error} />}
          <Button fullWidth loading={guardando} disabled={!elegida} onClick={() => void crear()}>Registrar orden</Button>
        </Card>
      </div>
    </div>
  )
}
