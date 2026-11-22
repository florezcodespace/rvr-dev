import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { AreaTexto } from '@shared/components/form/Campos'
import { IconBorrar, IconCheck } from '@shared/components/icons'
import { Alert } from '@shared/components/ui'
import { CATEGORIAS_SERVICIO } from '@shared/domain/estados'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'
import { useCarrito } from '@shared/hooks/useCarrito'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'
import { CATEGORIA_VISUAL, CifraViva, IconoCategoria, PanelTinta } from '../components/kit'

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

  const unidades = items.reduce((s, i) => s + i.cantidad, 0)
  const paso = descripcion.trim().length >= 10 && direccion.trim().length >= 5 ? 3 : items.length ? 2 : 1

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EncabezadoPortal eyebrow="Solicitud" titulo="Tu solicitud está vacía" descripcion="Elige en el catálogo los servicios que necesitas. Empieza por una categoría:" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIAS_SERVICIO.map((cat, i) => (
            <Link key={cat} to={`${ROUTES.portalCatalogo}?categoria=${encodeURIComponent(cat)}`}
              className="vidrio tarjeta-viva reflejo anim-entrada group flex flex-col gap-4 rounded-[22px] border border-[var(--rvr-glass-borde)] p-5"
              style={varsCss({ '--retraso': `${i * 60}ms` })}>
              <IconoCategoria categoria={cat} tamano={52} className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
              <span className="text-[15px] font-bold text-fg">{CATEGORIA_VISUAL[cat].corto}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal eyebrow="Solicitud de servicios" titulo="Revisa y envía tu solicitud" descripcion="RvR la valora y te envía la cotización a este portal. No pagas nada hasta aprobarla." />

      {/* Pasos */}
      <ol className="vidrio m-0 grid list-none grid-cols-3 gap-2 rounded-[20px] border border-[var(--rvr-glass-borde)] p-2">
        {['Elige los servicios', 'Cuéntanos el problema', 'Envía'].map((t, i) => {
          const hecho = paso > i + 1, actual = paso === i + 1
          return (
            <li key={t} className={cn('flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 transition-colors', actual && 'bg-primary-soft')}>
              <span className={cn('flex size-7 flex-none items-center justify-center rounded-full text-[13px] font-bold', hecho ? 'bg-primary text-white' : actual ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-surface-muted text-fg-subtle')}>
                {hecho ? <IconCheck width="14" height="14" /> : i + 1}
              </span>
              <span className={cn('hidden text-[13.5px] font-semibold sm:block', actual || hecho ? 'text-fg' : 'text-fg-subtle')}>{t}</span>
            </li>
          )
        })}
      </ol>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <section className="vidrio flex flex-col overflow-hidden rounded-[24px] border border-[var(--rvr-glass-borde)]">
            <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
              <h2 className="m-0 text-[16px] font-bold text-fg">1 · Tus servicios</h2>
              <Link to={ROUTES.portalCatalogo} className="text-[13px] font-semibold text-link hover:underline">+ Agregar más</Link>
            </div>
            {items.map((i) => (
              <div key={i.servicioId} className="anim-entrada flex flex-wrap items-center gap-4 border-b border-border-base px-5 py-4 last:border-b-0">
                <IconoCategoria categoria={i.categoria} tamano={44} />
                <div className="min-w-0 flex-1 basis-[calc(100%-64px)] sm:basis-auto">
                  <div className="text-[14.5px] font-bold text-fg">{i.nombre}</div>
                  <div className="text-[12.5px] text-fg-subtle">{i.categoria} · desde {formatearMoneda(i.precioBase)}</div>
                </div>
                {/* Cantidad */}
                <div className="ml-[60px] flex items-center rounded-[14px] border border-border-base bg-[var(--rvr-surface-raised)] p-1 sm:ml-0" aria-label={`Cantidad de ${i.nombre}`}>
                  <button type="button" aria-label="Uno menos" disabled={i.cantidad <= 1} onClick={() => cambiarCantidad(i.servicioId, i.cantidad - 1)}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-[18px] text-fg-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40">−</button>
                  <span className="w-8 text-center text-[15px] font-bold text-fg tabular-nums">{i.cantidad}</span>
                  <button type="button" aria-label="Uno más" disabled={i.cantidad >= 50} onClick={() => cambiarCantidad(i.servicioId, i.cantidad + 1)}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-[18px] text-fg-muted hover:bg-surface-muted disabled:opacity-40">+</button>
                </div>
                <button type="button" onClick={() => quitar(i.servicioId)} aria-label={`Quitar ${i.nombre}`}
                  className="ml-auto flex size-10 cursor-pointer items-center justify-center rounded-[12px] text-fg-subtle hover:bg-danger-soft hover:text-danger-fg sm:ml-0"><IconBorrar /></button>
              </div>
            ))}
          </section>

          <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
            <h2 className="m-0 text-[16px] font-bold text-fg">2 · Cuéntanos qué pasa</h2>
            <AreaTexto label="Describe el problema" value={descripcion} rows={4} maxLength={2000} error={errores.descripcion}
              onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. el computador se apaga solo y hace ruido; necesitamos cámaras en la entrada…" />
            <div className="flex flex-wrap gap-2">
              {['Se apaga solo', 'Está muy lento', 'No hay internet', 'Quiero instalar cámaras', 'Mantenimiento preventivo'].map((s) => (
                <button key={s} type="button" onClick={() => setDescripcion((d) => (d ? `${d.trim()} ${s.toLowerCase()}.` : `${s}.`))}
                  className="cursor-pointer rounded-full bg-surface-muted px-3 py-1.5 text-[12.5px] font-semibold text-fg-muted transition-colors hover:bg-primary-soft hover:text-fg">+ {s}</button>
              ))}
            </div>
            <AreaTexto label="Dirección donde se presta el servicio" value={direccion} rows={2} maxLength={150} error={errores.direccion} onChange={(e) => setDireccion(e.target.value)} />
          </section>
        </div>

        {/* ---------- Resumen ---------- */}
        <aside className="h-fit lg:sticky lg:top-24">
          <PanelTinta className="flex flex-col gap-4 p-5" intensidad={0.55}>
            <h2 className="m-0 text-[16px] font-bold text-white">3 · Resumen</h2>
            <div className="flex -space-x-2">
              {items.slice(0, 6).map((i) => <IconoCategoria key={i.servicioId} categoria={i.categoria} tamano={34} className="ring-2 ring-[#0f1a2e]" />)}
            </div>
            <div className="flex justify-between text-[13.5px] text-[#c6d4e8]"><span>Servicios</span><span className="font-bold text-white">{unidades}</span></div>
            <div className="border-t border-white/15 pt-3">
              <div className="text-[13px] text-[#9fb6d6]">Valor de referencia</div>
              <div className="font-display text-[32px] leading-tight font-extrabold text-white"><CifraViva valor={estimado} formato={formatearMoneda} duracion={450} /></div>
              <p className="m-0 mt-1 text-[12.5px] text-[#9fb6d6]">El valor final (con repuestos si hacen falta) llega en la cotización.</p>
            </div>
            {errores.general && <Alert tone="danger" title="No se envió" description={errores.general} />}
            <button type="button" disabled={enviando} onClick={() => void enviar()}
              className="pintura-boton boton-liquido inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] text-[15px] font-semibold disabled:opacity-60">
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </PanelTinta>
        </aside>
      </div>
    </div>
  )
}
