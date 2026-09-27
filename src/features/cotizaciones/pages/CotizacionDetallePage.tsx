import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { EstadoBadge } from '@shared/components/data'
import { Bloque, Datos, Volver } from '@shared/components/detalle'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { IconCheck, IconEnviar, IconX } from '@shared/components/icons'
import { Alert, Button, Card, PageHeader, SkeletonKpis } from '@shared/components/ui'
import { ESTADO_COTIZACION_META, ORIGEN_COTIZACION } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { cn } from '@shared/lib/cn'
import { cotizacionesService } from '../api'

/**
 * HU_41 · Detalle de la cotización (solo lectura, CA_41_05): servicios y
 * repuestos (CA_41_02), fechas de envío y respuesta (CA_41_03) y la orden que
 * generó (CA_41_04). Desde aquí: HU_81 enviar, HU_40 registrar la decisión y
 * HU_44 generar la orden.
 */
export default function CotizacionDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const cargar = useCallback((cid: number) => cotizacionesService.detalle(cid), [])
  const { datos: c, error, recargar } = useRecurso(cargar, id)
  const [dialogo, setDialogo] = useState<'enviar' | 'aprobar' | 'rechazar' | 'orden' | null>(null)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar la cotización" description={error} /></div>
  if (!c) return <div className="p-7"><SkeletonKpis /></div>

  const puedeOrden = c.estado === 'aprobada' && !c.orden && !c.ordenOrigen && tiene('ordenes.registrar')
  const servicios = c.detalle.filter((i) => i.tipo === 'servicio')
  const repuestos = c.detalle.filter((i) => i.tipo === 'repuesto')

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.cotizaciones} texto="Volver a cotizaciones" />
      <PageHeader
        eyebrow={`Venta – Órdenes · ${ORIGEN_COTIZACION[c.origen]}`}
        titulo={`Cotización ${c.numero}`}
        descripcion={<span className="inline-flex items-center gap-2">{c.cliente.nombre} · <EstadoBadge meta={ESTADO_COTIZACION_META[c.estado]} /></span>}
        acciones={
          <>
            {c.editable && tiene('cotizaciones.editar') && (
              <Link to={DETALLE.cotizacionEditar(c.id)}><Button variant="secondary">{c.estado === 'solicitada' && !c.valorada ? 'Valorar cotización' : 'Editar'}</Button></Link>
            )}
            {c.editable && tiene('cotizaciones.enviar') && (
              <Button leadingIcon={<IconEnviar />} disabled={!c.valorada || c.montoTotal <= 0} title={!c.valorada ? 'Valora todos los ítems antes de enviarla' : undefined} onClick={() => setDialogo('enviar')}>
                {c.estado === 'pendiente' ? 'Reenviar al cliente' : 'Enviar al cliente'}
              </Button>
            )}
            {c.estado === 'pendiente' && tiene('cotizaciones.registrar_decision') && (
              <>
                <Button variant="secondary" leadingIcon={<IconX />} onClick={() => setDialogo('rechazar')}>Registrar rechazo</Button>
                <Button leadingIcon={<IconCheck />} onClick={() => setDialogo('aprobar')}>Registrar aprobación</Button>
              </>
            )}
            {puedeOrden && <Button onClick={() => setDialogo('orden')}>Generar orden de servicio</Button>}
          </>
        }
      />

      {c.estado === 'solicitada' && !c.valorada && (
        <Alert tone="warning" title="Solicitud sin valorar" description="Revisa los servicios, agrega los repuestos que hagan falta y guarda. Luego envíala al cliente." />
      )}
      {c.estado === 'solicitada' && c.valorada && c.fechaEnvio && (
        <Alert tone="info" title="Modificada después de enviarla" description="El cliente aún no ve los cambios: envíala de nuevo." />
      )}
      {c.estado === 'pendiente' && (
        <Alert tone="info" title="Esperando la decisión del cliente"
          description={c.cliente.tieneCuenta ? 'El cliente puede aprobarla o rechazarla desde su portal. Si responde por teléfono o WhatsApp, registra aquí su decisión.' : 'El cliente no tiene cuenta en el portal: registra aquí la decisión que te comunique.'} />
      )}
      {c.estado === 'aprobada' && c.orden && (
        <Alert tone="success" title={`Generó la orden ${c.orden.codigo}`} description={<Link to={DETALLE.orden(c.orden.id)} className="font-semibold text-link underline">Ver la orden de servicio</Link>} />
      )}
      {c.estado === 'rechazada' && <Alert tone="danger" title="Cotización rechazada" description={c.motivoRechazo ? `Motivo: ${c.motivoRechazo}` : 'No genera orden de servicio.'} />}

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border-base px-5 py-3.5 text-[14px] font-bold text-fg">Detalle cotizado</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase">
                  <th className="px-5 py-2.5">Ítem</th>
                  <th className="w-[90px] px-2 py-2.5 text-right">Cantidad</th>
                  <th className="w-[140px] px-2 py-2.5 text-right">Precio unitario</th>
                  <th className="w-[140px] px-5 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {[...servicios, ...repuestos].map((i) => (
                  <tr key={i.id} className="border-t border-border-base">
                    <td className="px-5 py-3">
                      <span className={cn('mr-2 rounded-[6px] px-1.5 py-px text-[10px] font-bold tracking-[0.05em] uppercase', i.tipo === 'servicio' ? 'bg-primary-soft text-primary-on-soft' : 'bg-warning-soft text-warning-fg')}>
                        {i.tipo === 'servicio' ? 'Servicio' : 'Repuesto'}
                      </span>
                      <span className="text-[13px] font-semibold text-fg">{i.nombre}</span>
                      {i.categoria && <span className="ml-2 text-[11px] text-fg-subtle">{i.categoria}</span>}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[13px]">{i.cantidad}</td>
                    <td className="px-2 py-3 text-right font-mono text-[13px]">{i.precioUnitario > 0 ? formatearMoneda(i.precioUnitario) : <span className="text-warning-fg">Sin valorar</span>}</td>
                    <td className="px-5 py-3 text-right font-mono text-[13px] font-semibold text-fg">{formatearMoneda(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong">
                  <td colSpan={3} className="px-5 py-3.5 text-right text-[13px] font-semibold text-fg">Monto total</td>
                  <td className="px-5 py-3.5 text-right font-mono text-[18px] font-bold text-fg">{formatearMoneda(c.montoTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Bloque titulo="Cliente">
            <Datos columnas={1} items={[
              { label: 'Nombre', valor: tiene('clientes.ver_detalle') ? <Link to={DETALLE.cliente(c.cliente.id)} className="text-link hover:underline">{c.cliente.nombre}</Link> : c.cliente.nombre },
              { label: 'Documento', valor: <span className="font-mono">{c.cliente.documento}</span> },
              { label: 'Teléfono', valor: c.cliente.telefono || '—' },
              { label: 'Portal', valor: c.cliente.tieneCuenta ? 'Tiene cuenta: recibe el aviso' : 'Sin cuenta en el portal' },
            ]} />
          </Bloque>
          <Bloque titulo="Seguimiento">
            <Datos columnas={1} items={[
              { label: 'Fecha de la cotización', valor: c.fecha ? formatearFechaHora(c.fecha) : '—' },
              { label: 'Enviada al cliente', valor: c.fechaEnvio ? formatearFechaHora(c.fechaEnvio) : 'Aún no' },
              { label: 'Respuesta del cliente', valor: c.fechaRespuesta ? formatearFechaHora(c.fechaRespuesta) : 'Sin respuesta' },
              ...(c.respondidaPor ? [{ label: 'Decisión registrada por', valor: c.respondidaPor }] : []),
              ...(c.ordenOrigen ? [{ label: 'Recotización de la orden', valor: <Link to={DETALLE.orden(c.ordenOrigen.id)} className="font-mono whitespace-nowrap text-link hover:underline">{c.ordenOrigen.codigo}</Link> }] : []),
            ]} />
          </Bloque>
          {(c.descripcion || c.direccion) && (
            <Bloque titulo="Solicitud">
              <Datos columnas={1} items={[
                { label: 'Problema descrito', valor: c.descripcion || '—' },
                { label: 'Dirección del servicio', valor: c.direccion || c.cliente.direccion || '—' },
              ]} />
            </Bloque>
          )}
        </div>
      </div>

      <ConfirmarAccion
        abierto={dialogo === 'enviar'}
        titulo={`Enviar ${c.numero} al cliente`}
        descripcion={`Pasa a «pendiente» por ${formatearMoneda(c.montoTotal)}${c.cliente.tieneCuenta ? ' y el cliente recibe el aviso en su portal' : ''}.`}
        textoConfirmar="Enviar cotización"
        onCerrar={() => setDialogo(null)}
        onConfirmar={async () => {
          await cotizacionesService.enviar(c.id)
          mostrar({ tono: 'exito', mensaje: `${c.numero} enviada al cliente` })
          recargar()
        }}
      />
      <ConfirmarAccion
        abierto={dialogo === 'aprobar'}
        titulo="Registrar aprobación"
        descripcion="El cliente aprobó la cotización (por teléfono, WhatsApp o en persona). Queda registrado quién lo anotó."
        textoConfirmar="Registrar aprobación"
        onCerrar={() => setDialogo(null)}
        onConfirmar={async () => {
          await cotizacionesService.decidir(c.id, 'aprobada', null)
          mostrar({ tono: 'exito', mensaje: `${c.numero} aprobada` })
          recargar()
        }}
      />
      <ConfirmarAccion
        abierto={dialogo === 'rechazar'}
        titulo="Registrar rechazo"
        descripcion="Una cotización rechazada no se puede editar ni generar órdenes."
        textoConfirmar="Registrar rechazo"
        tono="danger"
        pedirMotivo="Motivo que dio el cliente"
        onCerrar={() => setDialogo(null)}
        onConfirmar={async (motivo) => {
          await cotizacionesService.decidir(c.id, 'rechazada', motivo || null)
          mostrar({ tono: 'exito', mensaje: `${c.numero} rechazada` })
          recargar()
        }}
      />
      <ConfirmarAccion
        abierto={dialogo === 'orden'}
        titulo="Generar orden de servicio"
        descripcion={`Cada uno de los ${c.detalle.length} ítems se vuelve un ítem de la orden, en estado pendiente. La orden nace «esperando anticipo».`}
        textoConfirmar="Generar orden"
        onCerrar={() => setDialogo(null)}
        onConfirmar={async () => {
          const o = await cotizacionesService.generarOrden(c.id)
          mostrar({ tono: 'exito', mensaje: `Orden ${o.codigo} creada` })
          navigate(DETALLE.orden(o.id))
        }}
      />
    </div>
  )
}
