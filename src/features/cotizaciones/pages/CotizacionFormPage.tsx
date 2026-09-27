import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { Volver } from '@shared/components/detalle'
import { AreaTexto, CLASE_CAMPO, Select } from '@shared/components/form/Campos'
import { IconBorrar, IconMas } from '@shared/components/icons'
import { Alert, Button, Card, Input, PageHeader, Skeleton } from '@shared/components/ui'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { formatearMoneda } from '@shared/lib/format'
import { cotizacionesService, type CotizacionDetalle, type ItemEntrada, type OpcionCliente, type OpcionServicio } from '../api'

interface Fila {
  clave: string
  tipo: 'servicio' | 'repuesto'
  servicioId?: number
  nombre: string
  categoria?: string
  descripcion: string
  cantidad: number
  /** Precio que ya tenía el ítem en la cotización (congelado). */
  precioPrevio?: number
  precio: number
}

let siguiente = 0
const clave = () => `f${++siguiente}`

/**
 * Maestro-detalle de la cotización: HU_36 Registrar (desde cero o valorando la
 * solicitud del cliente) y HU_39 Editar. Los servicios toman el precio base al
 * cotizar y quedan fijos (CA_36_03); los repuestos llevan el precio digitado.
 * Subtotales y total se calculan solos (CA_36_04 / CA_39_03).
 */
export default function CotizacionFormPage() {
  const { id } = useParams()
  const edicion = id !== undefined
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { mostrar } = useToast()

  const [original, setOriginal] = useState<CotizacionDetalle | null>(null)
  const [servicios, setServicios] = useState<OpcionServicio[] | null>(null)
  const [cliente, setCliente] = useState<OpcionCliente | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [filas, setFilas] = useState<Fila[]>([])
  const [servicioElegido, setServicioElegido] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    cotizacionesService.servicios().then((s) => activo && setServicios(s)).catch((e) => activo && setGeneral(mensajeDe(e)))
    if (edicion) {
      cotizacionesService.detalle(Number(id)).then((c) => {
        if (!activo) return
        setOriginal(c)
        setCliente({ id: c.cliente.id, nombre: c.cliente.nombre, documento: c.cliente.documento, direccion: c.cliente.direccion, estado: 'activo' })
        setDescripcion(c.descripcion)
        setDireccion(c.direccion)
        setFilas(c.detalle.map((i) => ({
          clave: clave(),
          tipo: i.tipo,
          servicioId: i.servicioId ?? undefined,
          nombre: i.nombre,
          categoria: i.categoria,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioPrevio: i.precioUnitario > 0 ? i.precioUnitario : undefined,
          // Una solicitud sin valorar toma el precio base vigente
          precio: i.tipo === 'servicio' ? (i.precioUnitario > 0 ? i.precioUnitario : (i.precioActual ?? 0)) : i.precioUnitario,
        })))
      }).catch((e) => activo && setGeneral(mensajeDe(e)))
    } else if (params.get('cliente')) {
      cotizacionesService.clientes('', Number(params.get('cliente'))).then((r) => {
        if (activo && r[0]) {
          setCliente(r[0])
          setDireccion(r[0].direccion ?? '')
        }
      }).catch(() => undefined)
    }
    return () => { activo = false }
  }, [edicion, id, params])

  const total = useMemo(() => filas.reduce((s, f) => s + f.cantidad * (f.precio || 0), 0), [filas])
  const porCategoria = useMemo(() => {
    const grupos = new Map<string, OpcionServicio[]>()
    for (const s of servicios ?? []) grupos.set(s.categoria, [...(grupos.get(s.categoria) ?? []), s])
    return [...grupos]
  }, [servicios])

  const agregarServicio = () => {
    const s = servicios?.find((x) => String(x.id) === servicioElegido)
    if (!s) return
    setErrores((e) => ({ ...e, items: '' }))
    setFilas((fs) => {
      const existente = fs.find((f) => f.tipo === 'servicio' && f.servicioId === s.id)
      if (existente) return fs.map((f) => (f === existente ? { ...f, cantidad: f.cantidad + 1 } : f))
      return [...fs, { clave: clave(), tipo: 'servicio', servicioId: s.id, nombre: s.nombre, categoria: s.categoria, descripcion: '', cantidad: 1, precio: s.precioBase }]
    })
    setServicioElegido('')
  }

  const agregarRepuesto = () => {
    setErrores((e) => ({ ...e, items: '' }))
    setFilas((fs) => [...fs, { clave: clave(), tipo: 'repuesto', nombre: '', descripcion: '', cantidad: 1, precio: 0 }])
  }

  const cambiar = (k: string, cambios: Partial<Fila>) => setFilas((fs) => fs.map((f) => (f.clave === k ? { ...f, ...cambios } : f)))
  const quitar = (k: string) => setFilas((fs) => fs.filter((f) => f.clave !== k))

  const guardar = async () => {
    const e: Record<string, string> = {}
    if (!cliente) e.cliente = 'Selecciona el cliente'
    if (filas.length === 0) e.items = 'Agrega al menos un servicio o repuesto'
    filas.forEach((f) => {
      if (f.cantidad < 1 || !Number.isInteger(f.cantidad)) e[`c-${f.clave}`] = 'Cantidad entera ≥ 1'
      if (f.tipo === 'repuesto') {
        if (f.descripcion.trim().length < 2) e[`d-${f.clave}`] = 'Describe el repuesto'
        if (!(f.precio >= 0)) e[`p-${f.clave}`] = 'Precio ≥ 0'
      }
    })
    setErrores(e)
    setGeneral(null)
    if (Object.keys(e).length) return

    const items: ItemEntrada[] = filas.map((f) =>
      f.tipo === 'servicio'
        ? { tipo: 'servicio', servicioId: f.servicioId!, cantidad: f.cantidad }
        : { tipo: 'repuesto', descripcion: f.descripcion.trim(), cantidad: f.cantidad, precioUnitario: f.precio },
    )
    setGuardando(true)
    try {
      if (edicion) {
        const r = await cotizacionesService.editar(Number(id), { descripcion: descripcion.trim() || null, direccion: direccion.trim() || null, items })
        mostrar({ tono: 'exito', mensaje: r.requiereReenvio ? `${r.numero} actualizada: envíala de nuevo para que el cliente vea los cambios` : `${r.numero} guardada` })
        navigate(DETALLE.cotizacion(r.id))
      } else {
        const r = await cotizacionesService.registrar({ clienteId: cliente!.id, descripcion: descripcion.trim() || null, direccion: direccion.trim() || null, items })
        mostrar({ tono: 'exito', mensaje: `${r.numero} registrada como solicitada` })
        navigate(DETALLE.cotizacion(r.id))
      }
    } catch (err) {
      setGeneral(mensajeDe(err))
    } finally {
      setGuardando(false)
    }
  }

  if (edicion && !original && !general) return <div className="p-7"><Skeleton className="h-64 w-full" /></div>
  if (original && !original.editable) {
    return (
      <div className="flex flex-col gap-4 p-7">
        <Volver a={DETALLE.cotizacion(Number(id))} texto="Volver a la cotización" />
        <Alert tone="warning" title={`La cotización está ${original.estado}`} description="Solo se editan cotizaciones solicitadas o pendientes (CA_39_02)." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 pb-24 sm:px-7">
      <Volver a={edicion ? DETALLE.cotizacion(Number(id)) : ROUTES.cotizaciones} texto={edicion ? 'Volver a la cotización' : 'Volver a cotizaciones'} />
      <PageHeader
        eyebrow="Venta – Órdenes · Cotizaciones"
        titulo={edicion ? (original?.estado === 'solicitada' && original.origen !== 'administrador' ? `Valorar ${original.numero}` : `Editar ${original?.numero ?? ''}`) : 'Registrar cotización'}
        descripcion={edicion && original?.origen === 'cliente' ? 'Solicitud enviada por el cliente desde el portal: revisa los servicios, agrega repuestos si hacen falta y guarda.' : 'Servicios del catálogo y repuestos o insumos, con cantidad y precio unitario.'}
      />

      {original?.estado === 'pendiente' && (
        <Alert tone="warning" title="Esta cotización ya fue enviada al cliente" description="Al guardar vuelve a «solicitada» y tendrás que enviarla de nuevo para que el cliente vea los cambios (CA_39_04)." />
      )}
      {original?.ordenOrigen && (
        <Alert tone="info" title={`Recotización de la orden ${original.ordenOrigen.codigo}`} description="La pidió el técnico desde el móvil. Al aprobarla, sus ítems se agregan a esa orden y a su venta." />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Card className="gap-4 p-5">
            <div className="text-[14px] font-bold text-fg">Cliente y solicitud</div>
            {edicion ? (
              <div className="rounded-[10px] border border-border-base bg-surface-muted px-3.5 py-2.5">
                <div className="text-[13.5px] font-semibold text-fg">{cliente?.nombre}</div>
                <div className="font-mono whitespace-nowrap text-[11.5px] text-fg-subtle">{cliente?.documento}</div>
              </div>
            ) : (
              <BuscadorCliente valor={cliente} error={errores.cliente} onElegir={(c) => { setCliente(c); if (c && !direccion) setDireccion(c.direccion ?? ''); setErrores((e) => ({ ...e, cliente: '' })) }} />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AreaTexto label="Descripción del problema" value={descripcion} maxLength={2000} rows={3} onChange={(e) => setDescripcion(e.target.value)} placeholder="Lo que reporta el cliente" />
              <AreaTexto label="Dirección del servicio" value={direccion} maxLength={150} rows={3} onChange={(e) => setDireccion(e.target.value)} />
            </div>
          </Card>

          <Card className="gap-3 p-0">
            <div className="flex flex-wrap items-end gap-2.5 border-b border-border-base px-5 py-4">
              <Select label="Agregar servicio del catálogo" className="min-w-[260px] flex-1" value={servicioElegido} onChange={(e) => setServicioElegido(e.target.value)}>
                <option value="">{servicios ? 'Selecciona un servicio activo…' : 'Cargando catálogo…'}</option>
                {porCategoria.map(([cat, lista]) => (
                  <optgroup key={cat} label={cat}>
                    {lista.map((s) => <option key={s.id} value={s.id}>{s.nombre} · {formatearMoneda(s.precioBase)}</option>)}
                  </optgroup>
                ))}
              </Select>
              <Button variant="secondary" leadingIcon={<IconMas />} disabled={!servicioElegido} onClick={agregarServicio}>Agregar servicio</Button>
              <Button variant="secondary" leadingIcon={<IconMas />} onClick={agregarRepuesto}>Agregar repuesto o insumo</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase">
                    <th className="px-5 py-2">Ítem</th>
                    <th className="w-[110px] px-2 py-2">Cantidad</th>
                    <th className="w-[160px] px-2 py-2 text-right">Precio unitario</th>
                    <th className="w-[140px] px-2 py-2 text-right">Subtotal</th>
                    <th className="w-[52px] px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.clave} className="border-t border-border-base align-top">
                      <td className="px-5 py-3">
                        <span className={cn('mb-1 inline-block rounded-[6px] px-1.5 py-px text-[10px] font-bold tracking-[0.05em] uppercase', f.tipo === 'servicio' ? 'bg-primary-soft text-primary-on-soft' : 'bg-warning-soft text-warning-fg')}>
                          {f.tipo === 'servicio' ? 'Servicio' : 'Repuesto'}
                        </span>
                        {f.tipo === 'servicio' ? (
                          <div>
                            <div className="text-[13px] font-semibold text-fg">{f.nombre}</div>
                            <div className="text-[11px] text-fg-subtle">{f.categoria}</div>
                          </div>
                        ) : (
                          <input
                            value={f.descripcion}
                            maxLength={255}
                            onChange={(e) => cambiar(f.clave, { descripcion: e.target.value })}
                            placeholder="Descripción del repuesto o insumo"
                            aria-label="Descripción del repuesto"
                            className={cn(CLASE_CAMPO, 'h-9', errores[`d-${f.clave}`] ? 'border-danger' : 'border-border-strong')}
                          />
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <input type="number" min={1} max={999} value={f.cantidad} aria-label={`Cantidad de ${f.nombre || 'repuesto'}`}
                          onChange={(e) => cambiar(f.clave, { cantidad: Math.max(0, Math.floor(Number(e.target.value))) })}
                          className={cn(CLASE_CAMPO, 'h-9 w-[90px] px-2.5', errores[`c-${f.clave}`] ? 'border-danger' : 'border-border-strong')} />
                      </td>
                      <td className="px-2 py-3 text-right">
                        {f.tipo === 'servicio' ? (
                          <div>
                            <div className="font-mono whitespace-nowrap text-[13px] text-fg">{formatearMoneda(f.precio)}</div>
                            <div className="text-[10.5px] text-fg-subtle">{f.precioPrevio ? 'Congelado en la cotización' : 'Precio base del catálogo'}</div>
                          </div>
                        ) : (
                          <input type="number" min={0} step="any" value={Number.isNaN(f.precio) ? '' : f.precio} aria-label="Precio unitario del repuesto"
                            onChange={(e) => cambiar(f.clave, { precio: Number(e.target.value) })}
                            className={cn(CLASE_CAMPO, 'h-9 w-[140px] px-2.5 text-right', errores[`p-${f.clave}`] ? 'border-danger' : 'border-border-strong')} />
                        )}
                      </td>
                      <td className="px-2 py-3 text-right font-mono text-[13px] font-semibold text-fg">{formatearMoneda(f.cantidad * (f.precio || 0))}</td>
                      <td className="px-2 py-3 text-right">
                        <button type="button" onClick={() => quitar(f.clave)} aria-label="Quitar ítem" title="Quitar ítem"
                          className="flex size-[30px] cursor-pointer items-center justify-center rounded-[8px] text-fg-subtle hover:bg-danger-soft hover:text-danger-fg">
                          <IconBorrar />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filas.length === 0 && (
                    <tr><td colSpan={5} className={cn('px-5 py-10 text-center text-[13px]', errores.items ? 'text-danger-fg' : 'text-fg-muted')}>
                      {errores.items || 'Agrega los servicios del catálogo y, si hacen falta, los repuestos o insumos.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="h-fit gap-3.5 p-5 xl:sticky xl:top-4">
          <div className="text-[14px] font-bold text-fg">Resumen</div>
          <dl className="m-0 flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between"><dt className="text-fg-muted">Servicios</dt><dd className="m-0 font-mono">{filas.filter((f) => f.tipo === 'servicio').length}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">Repuestos o insumos</dt><dd className="m-0 font-mono">{filas.filter((f) => f.tipo === 'repuesto').length}</dd></div>
            <div className="flex items-baseline justify-between border-t border-border-base pt-2.5">
              <dt className="font-semibold text-fg">Monto total</dt>
              <dd className="m-0 font-mono text-[20px] font-bold text-fg">{formatearMoneda(total)}</dd>
            </div>
          </dl>
          <p className="m-0 text-[11.5px] text-fg-subtle">El monto final lo calcula la base de datos al guardar. Queda «solicitada» hasta que la envíes al cliente.</p>
          {general && <Alert tone="danger" title="No se guardó" description={general} />}
          <Button fullWidth loading={guardando} onClick={() => void guardar()}>{guardando ? 'Guardando…' : edicion ? 'Guardar cotización' : 'Registrar cotización'}</Button>
          <Button fullWidth variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
        </Card>
      </div>
    </div>
  )
}

/** Búsqueda de cliente activo por nombre o documento (CA_83_02: los inactivos no aparecen). */
function BuscadorCliente({ valor, error, onElegir }: { valor: OpcionCliente | null; error?: string; onElegir: (c: OpcionCliente | null) => void }) {
  const [texto, setTexto] = useState('')
  const [opciones, setOpciones] = useState<OpcionCliente[]>([])
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (valor) return
    const t = setTimeout(() => cotizacionesService.clientes(texto).then(setOpciones).catch(() => setOpciones([])), 220)
    return () => clearTimeout(t)
  }, [texto, valor])

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  if (valor) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border-base bg-surface-muted px-3.5 py-2.5">
        <div>
          <div className="text-[13.5px] font-semibold text-fg">{valor.nombre}</div>
          <div className="font-mono whitespace-nowrap text-[11.5px] text-fg-subtle">{valor.documento}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onElegir(null)}>Cambiar</Button>
      </div>
    )
  }

  return (
    <div ref={caja} className="relative">
      <Input label="Cliente" value={texto} placeholder="Busca por nombre o documento…" error={error} autoComplete="off"
        onFocus={() => setAbierto(true)} onChange={(e) => { setTexto(e.target.value); setAbierto(true) }} />
      {abierto && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full list-none overflow-y-auto rounded-[11px] border border-border-base bg-surface p-1 shadow-[var(--rvr-shadow-lg)]">
          {opciones.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => { onElegir(c); setAbierto(false) }} className="flex w-full cursor-pointer flex-col rounded-[8px] px-3 py-2 text-left hover:bg-surface-muted">
                <span className="text-[13px] font-semibold text-fg">{c.nombre}</span>
                <span className="font-mono whitespace-nowrap text-[11px] text-fg-subtle">{c.documento}</span>
              </button>
            </li>
          ))}
          {opciones.length === 0 && <li className="px-3 py-3 text-[12.5px] text-fg-muted">No hay clientes activos con ese nombre o documento.</li>}
        </ul>
      )}
    </div>
  )
}
