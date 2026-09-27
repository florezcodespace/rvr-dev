import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { AreaTexto } from '@shared/components/form/Campos'
import { IconBorrar } from '@shared/components/icons'
import { Alert, Button, Card } from '@shared/components/ui'
import { useCarrito } from '@shared/hooks/useCarrito'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

/**
 * HU_78 · Solicitar los servicios que necesito: servicios activos con cantidad
 * (CA_78_01), problema y dirección (CA_78_02). Crea una cotización «solicitada»
 * sin valores (CA_78_03) que queda en «mis cotizaciones» (CA_78_05).
 */
export default function SolicitarPage() {
  const { items, cambiarCantidad, quitar, vaciar, estimado } = useCarrito()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const [descripcion, setDescripcion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [errores, setErrores] = useState<{ descripcion?: string; direccion?: string; general?: string }>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    portalService.perfil().then((p) => setDireccion((d) => d || p.direccion)).catch(() => undefined)
  }, [])

  const enviar = async () => {
    const e: typeof errores = {}
    if (descripcion.trim().length < 10) e.descripcion = 'Cuéntanos el problema (al menos 10 caracteres)'
    if (direccion.trim().length < 5) e.direccion = 'Escribe la dirección donde se presta el servicio'
    setErrores(e)
    if (Object.keys(e).length) return
    setEnviando(true)
    try {
      const r = await portalService.solicitar({
        items: items.map((i) => ({ servicioId: i.servicioId, cantidad: i.cantidad })),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
      })
      vaciar()
      mostrar({ tono: 'exito', mensaje: r.mensaje })
      navigate(DETALLE.portalCotizacion(r.id))
    } catch (err) {
      setErrores({ general: mensajeDe(err) })
    } finally {
      setEnviando(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <EncabezadoPortal eyebrow="Solicitud" titulo="Tu solicitud está vacía" descripcion="Elige en el catálogo los servicios que necesitas." />
        <div><Link to={ROUTES.portalCatalogo}><Button>Ir al catálogo</Button></Link></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPortal eyebrow="Solicitud de servicios" titulo="Revisa y envía tu solicitud" descripcion="RvR la valora y te envía la cotización a este portal. No pagas nada hasta aprobarla." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Card className="gap-0 p-0">
            {items.map((i) => (
              <div key={i.servicioId} className="flex flex-wrap items-center gap-3 border-b border-border-base px-5 py-4 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-fg">{i.nombre}</div>
                  <div className="text-[12px] text-fg-subtle">{i.categoria} · referencia {formatearMoneda(i.precioBase)}</div>
                </div>
                <label className="flex items-center gap-2 text-[12px] text-fg-muted">
                  Cantidad
                  <input type="number" min={1} max={50} value={i.cantidad} onChange={(e) => cambiarCantidad(i.servicioId, Number(e.target.value))}
                    className="h-9 w-[72px] rounded-[9px] border border-border-strong bg-surface px-2.5 text-[13px] text-fg" />
                </label>
                <button type="button" onClick={() => quitar(i.servicioId)} aria-label={`Quitar ${i.nombre}`}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-[9px] text-fg-subtle hover:bg-danger-soft hover:text-danger-fg"><IconBorrar /></button>
              </div>
            ))}
            <div className="px-5 py-3"><Link to={ROUTES.portalCatalogo} className="text-[13px] font-semibold text-link hover:underline">+ Agregar más servicios</Link></div>
          </Card>
          <Card className="gap-4 p-5">
            <AreaTexto label="Describe el problema" value={descripcion} rows={4} maxLength={2000} error={errores.descripcion}
              onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. el computador se apaga solo y hace ruido; necesitamos cámaras en la entrada…" />
            <AreaTexto label="Dirección donde se presta el servicio" value={direccion} rows={2} maxLength={150} error={errores.direccion} onChange={(e) => setDireccion(e.target.value)} />
          </Card>
        </div>
        <Card className="h-fit gap-3.5 p-5 lg:sticky lg:top-20">
          <div className="text-[14px] font-bold text-fg">Resumen</div>
          <div className="flex justify-between text-[13px]"><span className="text-fg-muted">Servicios</span><span className="font-mono">{items.reduce((s, i) => s + i.cantidad, 0)}</span></div>
          <div className="flex items-baseline justify-between border-t border-border-base pt-2.5"><span className="text-[13px] font-semibold text-fg">Valor de referencia</span><span className="font-mono whitespace-nowrap text-[18px] font-bold">{formatearMoneda(estimado)}</span></div>
          <p className="m-0 text-[11.5px] text-fg-subtle">El valor final (con repuestos si hacen falta) llega en la cotización.</p>
          {errores.general && <Alert tone="danger" title="No se envió" description={errores.general} />}
          <Button fullWidth size="lg" loading={enviando} onClick={() => void enviar()}>Enviar solicitud</Button>
        </Card>
      </div>
    </div>
  )
}
