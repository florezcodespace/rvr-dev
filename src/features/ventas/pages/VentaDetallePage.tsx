import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { DataTable, EstadoBadge, type Columna } from '@shared/components/data'
import { Bloque, Datos, Volver } from '@shared/components/detalle'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { MedidorSegmentado } from '@shared/components/charts'
import { Alert, Button, Card, PageHeader, SkeletonKpis, StatCard, StatGrid } from '@shared/components/ui'
import { ESTADO_ORDEN_META, ESTADO_PAGO_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { ventasService, type AbonoVenta } from '../api'
import { ModalAbono } from '../Modales'

/**
 * HU_56 · Estado de pago: total, anticipo, abonado y saldo recalculado con los
 * abonos (CA_56_01, CA_56_02), historial de abonos (CA_56_03) y estado visual
 * (CA_56_04). HU_57 · anular la venta con confirmación (CA_57_03).
 */
export default function VentaDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const cargar = useCallback((vid: number) => ventasService.detalle(vid), [])
  const { datos: v, error, recargar } = useRecurso(cargar, id)
  const [abono, setAbono] = useState(false)
  const [anular, setAnular] = useState(false)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar la venta" description={error} /></div>
  if (!v) return <div className="p-7"><SkeletonKpis /></div>

  const columnas: Columna<AbonoVenta>[] = [
    { clave: 'fecha', titulo: 'Fecha', ancho: '170px', render: (a) => <span className="font-mono whitespace-nowrap text-[12px]">{formatearFechaHora(a.fecha)}</span> },
    { clave: 'tipo', titulo: 'Tipo', ancho: '100px', render: (a) => (a.tipo === 'anticipo' ? 'Anticipo' : 'Saldo') },
    { clave: 'metodo', titulo: 'Método', ancho: '130px', render: (a) => a.metodo },
    { clave: 'referencia', titulo: 'Referencia', recortar: true, render: (a) => a.referencia || '—' },
    { clave: 'monto', titulo: 'Monto', ancho: '130px', alinear: 'right', render: (a) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{formatearMoneda(a.monto)}</span> },
  ]
  const avance = v.montoTotal ? Math.round((v.abonado / v.montoTotal) * 100) : 0
  const vigente = v.estadoPago !== 'anulada'

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.ventas} texto="Volver a ventas" />
      <PageHeader
        eyebrow="Venta – Órdenes · Estado de pago"
        titulo={`Venta de la orden ${v.orden.codigo}`}
        descripcion={<span className="inline-flex items-center gap-2">{v.cliente?.nombre ?? '—'} · <EstadoBadge meta={ESTADO_PAGO_META[v.estadoPago]} /></span>}
        acciones={
          <>
            <Link to={DETALLE.orden(v.orden.id)}><Button variant="secondary">Ver la orden</Button></Link>
            {vigente && tiene('ventas.cambiar_estado') && <Button variant="danger" onClick={() => setAnular(true)}>Anular venta</Button>}
            {vigente && v.saldo > 0 && tiene('abonos.registrar') && <Button onClick={() => setAbono(true)}>Registrar abono</Button>}
          </>
        }
      />
      {!vigente && <Alert tone="danger" title="Venta anulada" description="No recibe abonos ni suma en los ingresos de los reportes (CA_57_04)." />}
      <StatGrid>
        <StatCard etiqueta="Monto total" valor={formatearMoneda(v.montoTotal)} detalle="Cotizaciones aprobadas de la orden" glifo="$" tono="primary" />
        <StatCard etiqueta="Anticipo (50 %)" valor={formatearMoneda(v.montoAnticipo)} detalle={v.anticipoCubierto ? 'Cubierto' : 'Pendiente'} glifo="◐" tono={v.anticipoCubierto ? 'success' : 'warning'} detalleDestacado={!v.anticipoCubierto} />
        <StatCard etiqueta="Total abonado" valor={formatearMoneda(v.abonado)} detalle={`${v.abonos.length} abono(s)`} glifo="✓" tono="success" />
        <StatCard etiqueta="Saldo pendiente" valor={formatearMoneda(v.saldo)} detalle="Recalculado con los abonos" glifo="!" tono="danger" detalleDestacado={v.saldo > 0 && vigente} />
      </StatGrid>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Bloque titulo="Recaudo">
          <MedidorSegmentado porcentaje={avance} descripcion={`${avance} % recaudado`} />
          <Datos columnas={1} items={[
            { label: 'Estado de pago', valor: <EstadoBadge meta={ESTADO_PAGO_META[v.estadoPago]} /> },
            { label: 'Estado de la orden', valor: <EstadoBadge meta={ESTADO_ORDEN_META[v.orden.estado]} /> },
            { label: 'Fecha de la venta', valor: formatearFechaHora(v.fecha) },
          ]} />
        </Bloque>
        <Card className="flex min-h-[260px] flex-col overflow-hidden p-0">
          <div className="border-b border-border-base px-5 py-3.5 text-[14px] font-bold text-fg">Historial de abonos</div>
          <DataTable columnas={columnas} filas={v.abonos} claveFila={(a) => a.id} vacio={{ titulo: 'Sin abonos', descripcion: 'Registra el anticipo para iniciar el trabajo.' }} />
        </Card>
      </div>
      <ModalAbono abierto={abono} venta={{ ...v, codigo: v.orden.codigo }} onCerrar={() => setAbono(false)} onHecho={recargar} />
      <ConfirmarAccion
        abierto={anular}
        titulo="Anular la venta"
        descripcion="Una venta anulada no recibe abonos ni se suma a los ingresos. Esta acción no se deshace."
        textoConfirmar="Sí, anular"
        tono="danger"
        pedirMotivo="Motivo de la anulación"
        onCerrar={() => setAnular(false)}
        onConfirmar={async (motivo) => {
          await ventasService.anular(v.id, motivo || null)
          mostrar({ tono: 'exito', mensaje: 'Venta anulada' })
          recargar()
        }}
      />
    </div>
  )
}
