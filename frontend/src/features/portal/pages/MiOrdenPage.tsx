import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { Volver } from '@shared/components/detalle'
import { AreaTexto } from '@shared/components/form/Campos'
import { ResumenGarantia } from '@shared/components/garantia/ResumenGarantia'
import { IconCalendario, IconCheck, IconConfiguracion, IconEscudo, IconHistorial, IconPagos, IconReloj, IconServicios } from '@shared/components/icons'
import { Alert, Avatar, Button, Input, Modal, SkeletonKpis } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import { horaDe } from '@shared/lib/fechas'
import { ESTADO_COMPROBANTE_META, ESTADO_COTIZACION_META, ESTADO_ITEM_META, ESTADO_ORDEN_META, ESTADO_PAGO_META, ESTADO_VISITA_META } from '@shared/domain/estados'
import { useToast } from '@shared/hooks/useToast'
import { ErrorApi, mensajeDe } from '@shared/lib/api'
import { leerComprobante, type Adjunto } from '@shared/lib/archivos'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { armarPago, DatosDelPago, ElegirMetodo, PAGO_INICIAL, type DatosPago } from '@shared/components/pago'
import { AnilloProgreso, cuantoFalta, descargarEventoCalendario, SobreOscuro, fechaAmable, HojaCalendario, PanelTinta, RecorridoOrden, TituloBloque } from '../components/kit'

/**
 * HU_82 · Detalle de mi orden (solo lectura, CA_82_05): técnico asignado,
 * estado de pago con anticipo y saldo (CA_82_03) y, cuando está finalizada, la
 * solución aplicada por el técnico (CA_82_04).
 */
export default function MiOrdenPage() {
  const id = Number(useParams().id)
  const cargar = useCallback((oid: number) => portalService.orden(oid), [])
  const { datos: o, error, recargar } = useRecurso(cargar, id)
  const [pagando, setPagando] = useState(false)
  const [reclamando, setReclamando] = useState(false)

  if (error) return <Alert tone="danger" title="No encontramos esa orden" description={error} />
  if (!o) return <SkeletonKpis />
  const proxima = o.visitas.find((v) => v.estado === 'pendiente')
  const avance = o.venta ? Math.round((o.venta.abonado / Math.max(o.venta.montoTotal, 1)) * 100) : 0
  const enRevision = o.comprobantes.filter((c) => c.estado === 'pendiente').reduce((s, c) => s + c.monto, 0)
  const porReportar = o.venta && o.venta.estadoPago !== 'anulada' ? Math.max(o.venta.saldo - enRevision, 0) : 0
  const reclamoAbierto = o.garantia?.historialReclamos.some((r) => r.estado === 'pendiente')
  const g = o.garantia
  const diasGarantia = g ? Math.max(1, Math.round((+new Date(g.fechaFin) - +new Date(g.fechaInicio)) / 86_400_000)) : 0
  const servicios = o.items.map((i) => i.nombre).join(', ')

  return (
    <div className="flex flex-col gap-6">
      <Volver a={ROUTES.portalOrdenes} texto="Mis órdenes" />

      {/* ---------- Encabezado con el recorrido ---------- */}
      <PanelTinta className="p-6 sm:p-8" intensidad={0.6}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="vidrio-oscuro rounded-full px-3 py-1 text-[12.5px] font-semibold text-[#8ec5ff]">Orden de servicio</span>
              <SobreOscuro><EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} /></SobreOscuro>
            </div>
            <h1 className="mt-3 mb-0 font-mono text-[30px] leading-none font-bold tracking-[-0.5px] text-white sm:text-[38px]">{o.codigo}</h1>
            <p className="m-0 mt-2 max-w-[640px] text-[15px] leading-snug text-[#c6d4e8]">{servicios}</p>
          </div>
          <span className="text-[12.5px] text-[#9fb6d6]">Creada el {formatearFechaHora(o.fechaCreacion)}</span>
        </div>
        <div className="mt-7">
          <RecorridoOrden estado={o.estado} garantiaVigente={g?.vigente} grande oscuro />
        </div>
      </PanelTinta>

      {o.estado === 'esperando_anticipo' && <Alert tone="warning" title="Falta el anticipo" description="Para iniciar el servicio se requiere el 50 % del valor. Puedes reportar tu pago aquí mismo con el comprobante." />}
      {o.estado === 'en_espera_repuesto' && <Alert tone="info" title="Esperando un repuesto" description="El técnico necesita un repuesto. Revisa tus cotizaciones: hay una por aprobar." />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ---------- Visita ---------- */}
        <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
          <TituloBloque icono={IconCalendario} titulo="Visita técnica" />
          {proxima ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <HojaCalendario fecha={proxima.fechaProgramada} tamano="lg" />
                <div>
                  <span className="inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-[12px] font-bold text-primary-on-soft">{cuantoFalta(proxima.fechaProgramada)}</span>
                  <div className="mt-1 text-[18px] font-bold text-fg">{fechaAmable(proxima.fechaProgramada)}</div>
                  <div className="flex items-center gap-1.5 text-[14px] text-fg-muted"><IconReloj width="15" height="15" /> {horaDe(proxima.fechaProgramada)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[18px] bg-surface-muted p-3.5">
                <Avatar nombre={proxima.tecnico} tamano="lg" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-fg-subtle">Tu técnico</div>
                  <div className="text-[15px] font-bold text-fg">{proxima.tecnico}</div>
                </div>
                <span className={proxima.inicio ? 'flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--rvr-estado-completada-fg)]' : 'text-[12.5px] font-semibold text-fg-muted'}>
                  {proxima.inicio && <span className="anim-latido size-2 rounded-full bg-[var(--rvr-estado-completada)]" />}
                  {proxima.inicio ? 'En tu sitio ahora' : 'Programada'}
                </span>
              </div>
              <button type="button"
                onClick={() => descargarEventoCalendario({ titulo: `Visita RvR · ${o.codigo}`, inicio: proxima.fechaProgramada, descripcion: `Técnico: ${proxima.tecnico}. Servicios: ${servicios}` })}
                className="pintura-boton pintura-secundaria inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-border-base text-[14px] font-semibold text-fg">
                <IconCalendario width="16" height="16" /> Añadir a mi calendario
              </button>
            </div>
          ) : o.visitas.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {o.visitas.map((v) => (
                <li key={v.id} className="flex items-center gap-3 rounded-[16px] bg-surface-muted p-3 text-[13.5px]">
                  <HojaCalendario fecha={v.fechaProgramada} />
                  <span className="min-w-0 flex-1"><span className="block font-semibold text-fg">{fechaAmable(v.fechaProgramada)} · {horaDe(v.fechaProgramada)}</span><span className="text-fg-muted">{v.tecnico}</span></span>
                  <EstadoBadge meta={ESTADO_VISITA_META[v.estado]} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border-strong p-6 text-center text-[13.5px] text-fg-muted">RvR te contactará para agendar la visita.</div>
          )}
        </section>

        {/* ---------- Pago ---------- */}
        <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
          <TituloBloque icono={IconPagos} titulo="Estado de pago" accion={o.venta && <EstadoBadge meta={ESTADO_PAGO_META[o.venta.estadoPago]} />} />
          {o.venta ? (
            <>
              <div className="flex flex-wrap items-center gap-5">
                <AnilloProgreso porcentaje={avance} color={avance >= 100 ? 'var(--rvr-estado-completada)' : 'var(--rvr-primary)'}>
                  <span className="font-display text-[28px] leading-none font-extrabold text-fg">{avance}%</span>
                  <span className="text-[12px] text-fg-subtle">pagado</span>
                </AnilloProgreso>
                <dl className="m-0 grid min-w-[200px] flex-1 grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                  <div><dt className="text-fg-subtle">Valor total</dt><dd className="m-0 font-display text-[16px] font-extrabold text-fg">{formatearMoneda(o.venta.montoTotal)}</dd></div>
                  <div><dt className="text-fg-subtle">Anticipo 50 %</dt><dd className="m-0 font-display text-[16px] font-extrabold text-fg">{formatearMoneda(o.venta.montoAnticipo)}</dd></div>
                  <div><dt className="text-fg-subtle">Pagado</dt><dd className="m-0 font-display text-[16px] font-extrabold text-[var(--rvr-estado-completada-fg)]">{formatearMoneda(o.venta.abonado)}</dd></div>
                  <div><dt className="text-fg-subtle">Saldo</dt><dd className="m-0 font-display text-[16px] font-extrabold text-fg">{formatearMoneda(o.venta.estadoPago === 'anulada' ? 0 : o.venta.saldo)}</dd></div>
                </dl>
              </div>
              {porReportar > 0 && (
                <Button liquido fullWidth size="lg" onClick={() => setPagando(true)}>Reportar un pago</Button>
              )}
              {enRevision > 0 && (
                <p className="m-0 rounded-[14px] bg-primary-soft px-3.5 py-2.5 text-[12.5px] text-primary-on-soft">Tienes {formatearMoneda(enRevision)} en comprobantes por revisar: se descuentan del saldo cuando RvR los apruebe.</p>
              )}
              {o.comprobantes.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-2 border-t border-border-base p-0 pt-3">
                  {o.comprobantes.map((c) => (
                    <li key={c.id} className="text-[13px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-fg">{formatearFechaHora(c.fecha)} · <b className="font-semibold">{formatearMoneda(c.monto)}</b> · {c.metodo}</span>
                        <EstadoBadge meta={ESTADO_COMPROBANTE_META[c.estado]} />
                      </div>
                      {(c.detalle.length > 0 || c.referencia) && (
                        <div className="mt-0.5 text-[12px] text-fg-subtle">
                          {[...c.detalle.map((d) => d.valor), c.referencia && `Ref. ${c.referencia}`].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {c.motivoRechazo && <div className="mt-0.5 text-[12px] text-danger-fg">Motivo: {c.motivoRechazo}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border-strong p-6 text-center text-[13.5px] text-fg-muted">RvR registrará el valor de la orden con el anticipo.</div>
          )}
        </section>
      </div>

      {/* ---------- Solución ---------- */}
      {o.estado === 'finalizada' && (
        <section className="relative overflow-hidden rounded-[24px] border border-[var(--rvr-estado-completada)]/30 bg-[var(--rvr-estado-completada-soft)] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 flex-none items-center justify-center rounded-full bg-[var(--rvr-estado-completada)] text-white"><IconCheck width="22" height="22" /></span>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <h2 className="m-0 text-[17px] font-bold text-fg">Servicio terminado</h2>
              {o.diagnostico && <div><div className="text-[12px] font-bold text-fg-subtle uppercase">Lo que encontramos</div><p className="m-0 mt-1 text-[14px] leading-[1.6] text-fg">{o.diagnostico}</p></div>}
              <div><div className="text-[12px] font-bold text-fg-subtle uppercase">Lo que hicimos</div><p className="m-0 mt-1 text-[14px] leading-[1.6] text-fg">{o.solucion ?? '—'}</p></div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Garantía ---------- */}
      {g && (
        <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
          <TituloBloque icono={IconEscudo} titulo="Garantía" />
          <div className="flex flex-wrap items-center gap-5">
            <AnilloProgreso porcentaje={g.vigente ? (g.diasRestantes / diasGarantia) * 100 : 0} tamano={112} grosor={10} color="var(--rvr-estado-completada)">
              <span className="font-display text-[26px] leading-none font-extrabold text-fg">{g.vigente ? g.diasRestantes : 0}</span>
              <span className="text-[11.5px] text-fg-subtle">días</span>
            </AnilloProgreso>
            <div className="min-w-[220px] flex-1">
              <ResumenGarantia g={g} enlaceOrden={DETALLE.portalOrden} />
            </div>
          </div>
          {g.vigente && !reclamoAbierto && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-surface-muted p-4">
              <span className="text-[13.5px] text-fg-muted">¿El servicio volvió a fallar? Cuéntanos y lo revisamos sin costo si lo cubre la garantía.</span>
              <Button variant="secondary" onClick={() => setReclamando(true)}>Reclamar garantía</Button>
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ---------- Servicios ---------- */}
        <section className="vidrio flex flex-col gap-3 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
          <TituloBloque icono={IconServicios} titulo="Servicios contratados" />
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-[16px] bg-surface-muted p-3">
                <span className={cn('flex size-9 flex-none items-center justify-center rounded-[11px] text-white', i.tipo === 'repuesto' ? 'bg-[#f59e0b]' : 'bg-primary')}>
                  {i.tipo === 'repuesto' ? <IconConfiguracion width="16" height="16" /> : <IconServicios width="16" height="16" />}
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-fg">{i.cantidad} × {i.nombre}</span>
                <EstadoBadge meta={ESTADO_ITEM_META[i.estado]} />
              </li>
            ))}
          </ul>
          {o.cotizaciones.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border-base pt-3">
              {o.cotizaciones.map((q) => (
                <Link key={q.id} to={DETALLE.portalCotizacion(q.id)} className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-[12.5px] font-semibold text-link hover:bg-primary-soft">
                  <span className="font-mono">{q.numero}</span> <EstadoBadge meta={ESTADO_COTIZACION_META[q.estado]} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ---------- Seguimiento ---------- */}
        <section className="vidrio flex flex-col gap-3 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5">
          <TituloBloque icono={IconHistorial} titulo="Seguimiento" />
          <ol className="m-0 flex list-none flex-col p-0">
            {[...o.historial].reverse().map((h, i, arr) => (
              <li key={i} className="flex gap-3.5">
                <span className="flex flex-col items-center">
                  <span className={cn('mt-1 flex size-4 flex-none items-center justify-center rounded-full', i === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-[var(--rvr-border-strong)]')} />
                  {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-border-base" />}
                </span>
                <div className="pb-4">
                  <div className={cn('text-[14px] font-bold', i === 0 ? 'text-fg' : 'text-fg-muted')}>{ESTADO_ORDEN_META[h.estado]?.label ?? h.estado}</div>
                  <div className="text-[12.5px] text-fg-subtle">{formatearFechaHora(h.fecha)}</div>
                  {h.descripcion && <div className="mt-0.5 text-[13px] text-fg-muted">{h.descripcion}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {pagando && <ReportarPago ordenId={o.id} maximo={porReportar} onCerrar={() => setPagando(false)} onHecho={recargar} />}
      {reclamando && <ReclamarGarantia ordenId={o.id} onCerrar={() => setReclamando(false)} onHecho={recargar} />}
    </div>
  )
}

/** [Feedback 12] El cliente elige cómo pagó, llena sus datos y adjunta el comprobante para que RvR lo apruebe. */
function ReportarPago({ ordenId, maximo, onCerrar, onHecho }: { ordenId: number; maximo: number; onCerrar: () => void; onHecho: () => void }) {
  const { mostrar } = useToast()
  const [paso, setPaso] = useState<'metodo' | 'datos'>('metodo')
  const [monto, setMonto] = useState(String(Math.round(maximo)))
  const [pago, setPago] = useState<DatosPago>(PAGO_INICIAL)
  const [archivo, setArchivo] = useState<Adjunto | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  const elegir = async (f: File | undefined) => {
    setErrores((e) => ({ ...e, archivo: '' }))
    if (!f) return setArchivo(null)
    try {
      setArchivo(await leerComprobante(f))
    } catch (e) {
      setArchivo(null)
      setErrores((x) => ({ ...x, archivo: mensajeDe(e) }))
    }
  }

  const continuar = () => {
    const valor = Number(monto)
    const nuevos: Record<string, string> = {}
    if (!valor || valor <= 0) nuevos.monto = 'Escribe el valor que pagaste'
    else if (valor > maximo) nuevos.monto = `Máximo ${formatearMoneda(maximo)}`
    if (!pago.opcion) nuevos.metodo = 'Elige cómo pagaste'
    setErrores(nuevos)
    if (!Object.keys(nuevos).length) setPaso('datos')
  }

  const enviar = async () => {
    const pedido = armarPago(pago)
    const nuevos: Record<string, string> = { ...pedido.errores }
    if (!archivo) nuevos.archivo = 'Adjunta la foto o el PDF del comprobante'
    setErrores(nuevos)
    if (Object.keys(nuevos).length || !pedido.metodoPago) return
    setEnviando(true)
    try {
      const r = await portalService.enviarComprobante(ordenId, { monto: Number(monto), metodoPago: pedido.metodoPago, referencia: pedido.referencia, detalle: pedido.detalle, archivo: archivo! })
      mostrar({ tono: 'exito', mensaje: r.mensaje })
      onHecho()
      onCerrar()
    } catch (e) {
      if (e instanceof ErrorApi && Object.keys(e.campos).length) {
        setErrores({ ...e.campos, ...(e.campos.monto && { general: e.campos.monto }), ...(e.campos.detalle && { general: e.campos.detalle }) })
      } else setErrores({ general: mensajeDe(e) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} ancho="lg"
      titulo={paso === 'metodo' ? 'Elige cómo pagar' : 'Datos del pago'}
      descripcion={paso === 'metodo' ? 'Cuéntanos cuánto y cómo pagaste. RvR revisa el comprobante y, al aprobarlo, se descuenta de tu saldo.' : `Valor: ${formatearMoneda(Number(monto))}`}
      pie={paso === 'metodo'
        ? <><Button variant="secondary" onClick={onCerrar}>Cancelar</Button><Button onClick={continuar}>Continuar</Button></>
        : <><Button variant="secondary" onClick={() => setPaso('metodo')}>Atrás</Button><Button loading={enviando} onClick={() => void enviar()}>Enviar comprobante</Button></>}>
      {paso === 'metodo' ? (
        <div className="flex flex-col gap-5">
          <Input label="Valor pagado (COP)" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/[^0-9]/g, ''))}
            error={errores.monto} hint={`Por pagar: ${formatearMoneda(maximo)}`} className="sm:max-w-[280px]" />
          <ElegirMetodo valor={pago.opcion} onChange={(o) => setPago({ ...pago, opcion: o })} efectivo={false} error={errores.metodo} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <DatosDelPago valor={pago} onChange={setPago} errores={errores} onCambiar={() => setPaso('metodo')} />
          <div className="flex flex-col">
            <label htmlFor="comprobante" className="mb-1.5 text-[13px] font-semibold text-fg">Comprobante</label>
            <input id="comprobante" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => void elegir(e.target.files?.[0])}
              className="cursor-pointer rounded-[10px] border border-dashed border-border-strong bg-surface-muted px-3.5 py-3 text-[13px] text-fg file:mr-3 file:cursor-pointer file:rounded-[14px] file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:font-semibold file:text-primary-on-soft" />
            {errores.archivo ? <p className="mt-1.5 text-[12px] text-danger-fg">{errores.archivo}</p>
              : <p className="mt-1.5 text-[12px] text-fg-subtle">{archivo ? `Listo: ${archivo.nombre}` : 'Foto del voucher, captura de la app o PDF del banco. Imagen (JPG, PNG, WEBP) o PDF de máximo 3 MB.'}</p>}
          </div>
          {errores.general && <Alert tone="danger" title="No se envió" description={errores.general} />}
        </div>
      )}
    </Modal>
  )
}

/** [Feedback 13] El cliente reclama la garantía de su orden. */
function ReclamarGarantia({ ordenId, onCerrar, onHecho }: { ordenId: number; onCerrar: () => void; onHecho: () => void }) {
  const { mostrar } = useToast()
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    if (texto.trim().length < 10) return setError('Cuéntanos qué falla (mínimo 10 caracteres).')
    setEnviando(true)
    setError(null)
    try {
      const r = await portalService.reclamarGarantia(ordenId, texto.trim())
      mostrar({ tono: 'exito', mensaje: r.mensaje })
      onHecho()
      onCerrar()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Reclamar garantía" descripcion="Describe la falla. RvR revisará tu reclamo y te responderá por aquí."
      pie={<><Button variant="secondary" onClick={onCerrar}>Cancelar</Button><Button loading={enviando} onClick={() => void enviar()}>Enviar reclamo</Button></>}>
      <div className="flex flex-col gap-3">
        <AreaTexto label="¿Qué está fallando?" value={texto} rows={4} maxLength={2000} onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej. La cámara de la entrada volvió a perder la señal en las noches." />
        {error && <Alert tone="danger" title="No se envió" description={error} />}
      </div>
    </Modal>
  )
}
