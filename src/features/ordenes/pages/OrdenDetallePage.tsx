import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ModalAbono, ModalVenta } from '@features/ventas'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge, SelectorEstado } from '@shared/components/data'
import { Bloque, Datos, SinDatos, Volver } from '@shared/components/detalle'
import { AreaTexto } from '@shared/components/form/Campos'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { IconEditar } from '@shared/components/icons'
import { Alert, Button, Card, Modal, PageHeader, SkeletonKpis } from '@shared/components/ui'
import {
  ESTADO_COTIZACION_META, ESTADO_ITEM_META, ESTADO_ORDEN_META, ESTADO_PAGO_META, ESTADO_VISITA_META,
  TRANSICIONES_ITEM, type EstadoOrden,
} from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { ordenesService, type OrdenDetalle } from '../api'

type Item = OrdenDetalle['items'][number]

/**
 * HU_50 · Detalle de la orden: código, cliente, estado y observaciones
 * (CA_50_01), ítems con estado y notas (CA_50_02), reporte técnico del móvil
 * (CA_50_03), visitas (CA_50_04) y venta (CA_50_05). Desde aquí:
 * HU_47 observaciones · HU_48 estado de la orden · HU_49 estado de cada ítem.
 */
export default function OrdenDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const cargar = useCallback((oid: number) => ordenesService.detalle(oid), [])
  const { datos: o, error, recargar } = useRecurso(cargar, id)
  const [destino, setDestino] = useState<EstadoOrden | null>(null)
  const [editObs, setEditObs] = useState(false)
  const [notasItem, setNotasItem] = useState<Item | null>(null)
  const [venta, setVenta] = useState(false)
  const [abono, setAbono] = useState(false)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar la orden" description={error} /></div>
  if (!o) return <div className="p-7"><SkeletonKpis /></div>

  const cerrada = o.estado === 'finalizada' || o.estado === 'cancelada'
  const pendientesItems = o.items.filter((i) => i.estado !== 'completado').length

  const cambiarItem = async (item: Item, estado: Item['estado']) => {
    try {
      await ordenesService.item(o.id, item.id, { estado })
      mostrar({ tono: 'exito', mensaje: `«${item.nombre}» → ${ESTADO_ITEM_META[estado].label}` })
      recargar()
    } catch (e) {
      mostrar({ tono: 'error', mensaje: mensajeDe(e) })
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.ordenes} texto="Volver a órdenes" />
      <PageHeader
        eyebrow="Venta – Órdenes · Detalle de la orden"
        titulo={`Orden ${o.codigo}`}
        descripcion={`${o.cliente?.nombre ?? 'Sin cliente'} · creada el ${formatearFechaHora(o.fechaCreacion)}`}
        acciones={
          <>
            {tiene('ordenes.cambiar_estado') ? (
              <SelectorEstado valor={o.estado} meta={ESTADO_ORDEN_META} transiciones={o.transiciones} registro={o.codigo} onCambiar={setDestino} />
            ) : (
              <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} />
            )}
            {!cerrada && tiene('agenda.agendar') && <Link to={`${ROUTES.agenda}?agendar=${o.id}`}><Button variant="secondary">Agendar visita</Button></Link>}
            {!o.venta && o.estado !== 'cancelada' && tiene('ventas.registrar') && <Button onClick={() => setVenta(true)}>Registrar venta</Button>}
            {o.venta && o.venta.estadoPago !== 'anulada' && o.venta.saldo > 0 && tiene('abonos.registrar') && <Button onClick={() => setAbono(true)}>Registrar abono</Button>}
          </>
        }
      />

      {o.estado === 'esperando_anticipo' && (
        <Alert tone="warning" title="Esperando el anticipo del 50 %"
          description={o.venta ? 'Cuando se registre el anticipo la orden pasa sola a «en proceso».' : 'Registra la venta de la orden y luego el anticipo para iniciar el trabajo.'} />
      )}
      {o.estado === 'en_espera_repuesto' && (
        <Alert tone="info" title="En espera de repuesto" description="El técnico pidió una recotización. Cuando el cliente la responda, la orden vuelve a «en proceso»." />
      )}
      {o.estado === 'en_proceso' && pendientesItems > 0 && tiene('ordenes.cambiar_estado') && (
        <Alert tone="info" title={`${pendientesItems} ítem(s) sin completar`} description="La orden solo se finaliza con todos sus ítems completados (CA_49_02)." />
      )}

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3.5">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border-base px-5 py-3.5">
              <div className="text-[14px] font-bold text-fg">Ítems de la orden</div>
              <div className="font-mono whitespace-nowrap text-[13px] font-semibold text-fg">{formatearMoneda(o.totalItems)}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase">
                    <th className="px-5 py-2.5">Servicio o repuesto</th>
                    <th className="w-[70px] px-2 py-2.5 text-right">Cant.</th>
                    <th className="w-[120px] px-2 py-2.5 text-right">Subtotal</th>
                    <th className="w-[150px] px-2 py-2.5">Asignado</th>
                    <th className="w-[150px] px-2 py-2.5">Estado</th>
                    <th className="w-[44px] px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id} className="border-t border-border-base align-top">
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-semibold text-fg">
                          <span className={cn('mr-2 rounded-[6px] px-1.5 py-px text-[10px] font-bold uppercase', i.tipo === 'servicio' ? 'bg-primary-soft text-primary-on-soft' : 'bg-warning-soft text-warning-fg')}>{i.tipo}</span>
                          {i.nombre}
                        </div>
                        {i.notas && <div className="mt-1 text-[12px] text-fg-muted">Notas del técnico: {i.notas}</div>}
                      </td>
                      <td className="px-2 py-3 text-right font-mono text-[13px]">{i.cantidad}</td>
                      <td className="px-2 py-3 text-right font-mono text-[13px]">{formatearMoneda(i.subtotal)}</td>
                      <td className="px-2 py-3 text-[12px] text-fg-muted">{formatearFechaHora(i.fechaAsignacion)}</td>
                      <td className="px-2 py-3">
                        {tiene('ordenes.cambiar_estado_item') && !cerrada ? (
                          <SelectorEstado valor={i.estado} meta={ESTADO_ITEM_META} transiciones={TRANSICIONES_ITEM[i.estado]} registro={i.nombre} onCambiar={(e) => void cambiarItem(i, e)} />
                        ) : (
                          <EstadoBadge meta={ESTADO_ITEM_META[i.estado]} />
                        )}
                      </td>
                      <td className="px-2 py-3">
                        {tiene('ordenes.registrar_observaciones') && (
                          <button type="button" onClick={() => setNotasItem(i)} title="Notas del técnico" aria-label={`Notas de ${i.nombre}`}
                            className="flex size-[30px] cursor-pointer items-center justify-center rounded-[8px] text-fg-subtle hover:bg-surface-muted hover:text-fg">
                            <IconEditar />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Bloque titulo="Reporte técnico" subtitulo={o.reporteTecnico.tecnico ? `Registrado desde el móvil por ${o.reporteTecnico.tecnico}` : 'Lo registra el técnico desde la app móvil'}>
            {!o.reporteTecnico.diagnostico && o.reporteTecnico.materiales.length === 0 ? (
              <SinDatos texto="El técnico aún no ha registrado diagnóstico, materiales ni solución." />
            ) : (
              <div className="flex flex-col gap-3.5">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Diagnóstico del equipo</div>
                  <p className="m-0 mt-1 text-[13.5px] leading-[1.6] text-fg">{o.reporteTecnico.diagnostico ?? '—'}</p>
                  {o.reporteTecnico.fechaDiagnostico && <div className="text-[11px] text-fg-faint">{formatearFechaHora(o.reporteTecnico.fechaDiagnostico)}</div>}
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Solución aplicada</div>
                  <p className="m-0 mt-1 text-[13.5px] leading-[1.6] text-fg">{o.reporteTecnico.solucion ?? 'Pendiente'}</p>
                  {o.reporteTecnico.fechaSolucion && <div className="text-[11px] text-fg-faint">{formatearFechaHora(o.reporteTecnico.fechaSolucion)}</div>}
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Materiales utilizados</div>
                  {o.reporteTecnico.materiales.length === 0 ? <span className="text-[13px] text-fg-muted">Ninguno registrado</span> : (
                    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                      {o.reporteTecnico.materiales.map((m) => (
                        <li key={m.id} className="rounded-[8px] border border-border-base bg-surface-muted px-2.5 py-1 text-[12px] text-fg">{m.cantidad} × {m.descripcion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Bloque>

          <Bloque titulo="Visitas técnicas" accion={!cerrada && tiene('agenda.agendar') ? <Link to={`${ROUTES.agenda}?agendar=${o.id}`} className="text-[12.5px] font-semibold text-link hover:underline">Agendar</Link> : undefined}>
            {o.visitas.length === 0 ? <SinDatos texto="Aún no hay visitas agendadas." /> : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {o.visitas.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-border-base px-3.5 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-fg">{formatearFechaHora(v.fechaProgramada)} · {v.tecnico.nombre}</span>
                      <span className="block text-[11.5px] text-fg-subtle">
                        {v.inicio ? `Inició ${formatearFechaHora(v.inicio)}` : 'Sin iniciar'}{v.fin && ` · terminó ${formatearFechaHora(v.fin)}`}{v.notas && ` · ${v.notas}`}
                      </span>
                    </span>
                    <EstadoBadge meta={ESTADO_VISITA_META[v.estado]} />
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </div>

        <div className="flex flex-col gap-3.5">
          <Bloque titulo="Cliente">
            {o.cliente ? (
              <Datos columnas={1} items={[
                { label: 'Nombre', valor: tiene('clientes.ver_detalle') ? <Link to={DETALLE.cliente(o.cliente.id)} className="text-link hover:underline">{o.cliente.nombre}</Link> : o.cliente.nombre },
                { label: 'Documento', valor: <span className="font-mono">{o.cliente.documento}</span> },
                { label: 'Teléfono', valor: o.cliente.telefono || '—' },
                { label: 'Dirección del servicio', valor: o.cliente.direccion || '—' },
              ]} />
            ) : <SinDatos texto="Sin cliente" />}
          </Bloque>

          <Bloque titulo="Venta y pagos" accion={o.venta && tiene('ventas.consultar_estado') ? <Link to={DETALLE.venta(o.venta.id)} className="text-[12.5px] font-semibold text-link hover:underline">Estado de pago</Link> : undefined}>
            {o.venta ? (
              <>
                <Datos columnas={2} items={[
                  { label: 'Monto total', valor: <span className="font-mono">{formatearMoneda(o.venta.montoTotal)}</span> },
                  { label: 'Anticipo', valor: <span className="font-mono">{formatearMoneda(o.venta.montoAnticipo)}</span> },
                  { label: 'Abonado', valor: <span className="font-mono">{formatearMoneda(o.venta.abonado)}</span> },
                  { label: 'Saldo pendiente', valor: <span className="font-mono whitespace-nowrap font-bold">{formatearMoneda(o.venta.estadoPago === 'anulada' ? 0 : o.venta.saldo)}</span> },
                ]} />
                <EstadoBadge meta={ESTADO_PAGO_META[o.venta.estadoPago]} />
              </>
            ) : <SinDatos texto="La orden aún no tiene venta registrada." />}
          </Bloque>

          <Bloque titulo="Observaciones" accion={tiene('ordenes.registrar_observaciones') ? <button type="button" onClick={() => setEditObs(true)} className="cursor-pointer text-[12.5px] font-semibold text-link hover:underline">Registrar</button> : undefined}>
            <p className="m-0 text-[13px] leading-[1.6] whitespace-pre-line text-fg">{o.observaciones || <span className="text-fg-muted">Sin observaciones.</span>}</p>
          </Bloque>

          <Bloque titulo="Cotizaciones">
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {o.cotizaciones.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <Link to={DETALLE.cotizacion(q.id)} className="font-mono whitespace-nowrap font-semibold text-link hover:underline">{q.numero}</Link>
                  <span className="text-fg-subtle">{q.recotizacion ? 'Recotización' : 'Origen'} · {formatearMoneda(q.montoTotal)}</span>
                  <EstadoBadge meta={ESTADO_COTIZACION_META[q.estado]} />
                </li>
              ))}
            </ul>
          </Bloque>

          <Bloque titulo="Historial">
            <ol className="m-0 flex list-none flex-col gap-2.5 border-l border-border-base p-0 pl-4">
              {o.historial.map((h) => (
                <li key={h.id} className="relative">
                  <span aria-hidden="true" className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface bg-primary" />
                  <div className="text-[12.5px] font-semibold text-fg">{h.descripcion}</div>
                  <div className="text-[11px] text-fg-subtle">{formatearFechaHora(h.fecha)}{h.usuario && ` · ${h.usuario}`}</div>
                </li>
              ))}
            </ol>
          </Bloque>
        </div>
      </div>

      <ConfirmarAccion
        abierto={destino !== null}
        titulo={destino ? `Cambiar a «${ESTADO_ORDEN_META[destino].label}»` : ''}
        descripcion={destino === 'cancelada' ? 'Cancelada es un estado final: la orden no se puede reabrir y sus visitas pendientes se cancelan.' : destino === 'finalizada' ? 'Finalizada es un estado final.' : undefined}
        textoConfirmar="Cambiar estado"
        tono={destino === 'cancelada' ? 'danger' : 'primary'}
        pedirMotivo="Motivo o comentario (queda en el historial)"
        onCerrar={() => setDestino(null)}
        onConfirmar={async (motivo) => {
          await ordenesService.cambiarEstado(o.id, destino!, motivo || null)
          mostrar({ tono: 'exito', mensaje: `${o.codigo} → ${ESTADO_ORDEN_META[destino!].label}` })
          recargar()
        }}
      />
      <EditorTexto
        abierto={editObs}
        titulo="Observaciones de la orden"
        etiqueta="Novedades ocurridas durante la ejecución del servicio"
        inicial={o.observaciones}
        onCerrar={() => setEditObs(false)}
        onGuardar={async (t) => {
          await ordenesService.observaciones(o.id, t || null)
          mostrar({ tono: 'exito', mensaje: 'Observaciones guardadas' })
          recargar()
        }}
      />
      <EditorTexto
        abierto={notasItem !== null}
        titulo={`Notas del técnico · ${notasItem?.nombre ?? ''}`}
        etiqueta="Notas sobre este ítem"
        inicial={notasItem?.notas ?? ''}
        onCerrar={() => setNotasItem(null)}
        onGuardar={async (t) => {
          await ordenesService.item(o.id, notasItem!.id, { notas: t })
          mostrar({ tono: 'exito', mensaje: 'Notas guardadas' })
          recargar()
        }}
      />
      <ModalVenta abierto={venta} orden={{ id: o.id, codigo: o.codigo, total: o.totalItems }} onCerrar={() => setVenta(false)} onHecho={recargar} />
      {o.venta && (
        <ModalAbono
          abierto={abono}
          venta={{ id: o.venta.id, saldo: o.venta.saldo, montoAnticipo: o.venta.montoAnticipo, abonado: o.venta.abonado, anticipoCubierto: o.venta.abonado >= o.venta.montoAnticipo && o.venta.abonado > 0, codigo: o.codigo }}
          onCerrar={() => setAbono(false)}
          onHecho={recargar}
        />
      )}
    </div>
  )
}

function EditorTexto({ abierto, titulo, etiqueta, inicial, onCerrar, onGuardar }: {
  abierto: boolean
  titulo: string
  etiqueta: string
  inicial: string
  onCerrar: () => void
  onGuardar: (texto: string) => Promise<void>
}) {
  const [texto, setTexto] = useState(inicial)
  const [previo, setPrevio] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const clave = abierto ? inicial : null
  if (clave !== previo) {
    setPrevio(clave)
    setTexto(inicial)
    setError(null)
  }
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo}
      pie={
        <>
          <Button variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button loading={guardando} onClick={async () => {
            setGuardando(true)
            try { await onGuardar(texto.trim()); onCerrar() } catch (e) { setError(mensajeDe(e)) } finally { setGuardando(false) }
          }}>Guardar</Button>
        </>
      }>
      <div className="flex flex-col gap-3">
        <AreaTexto label={etiqueta} value={texto} rows={5} maxLength={4000} onChange={(e) => setTexto(e.target.value)} />
        {error && <Alert tone="danger" title="No se guardó" description={error} />}
      </div>
    </Modal>
  )
}
