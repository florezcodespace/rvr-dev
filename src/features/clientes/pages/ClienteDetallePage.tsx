import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { CambioActivo, DataTable, EstadoBadge, type Columna } from '@shared/components/data'
import { Bloque, Datos, Volver } from '@shared/components/detalle'
import { ESTADO_COTIZACION_META, ESTADO_ORDEN_META, ESTADO_REGISTRO_META, ORIGEN_COTIZACION } from '@shared/domain/estados'
import { Alert, Avatar, Button, Card, PageHeader, SkeletonKpis, StatCard, StatGrid } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { clientesService, type ClienteDetalle } from '../api'
import { FormCliente } from '../FormCliente'

type Cot = ClienteDetalle['historialCotizaciones'][number]
type Ord = ClienteDetalle['historialOrdenes'][number]

/** HU_35 · Detalle del cliente: datos, historial de cotizaciones (CA_35_02) y sus órdenes (CA_35_03). */
export default function ClienteDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const cargar = useCallback((cid: number) => clientesService.detalle(cid), [])
  const { datos: c, error, recargar } = useRecurso(cargar, id)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el cliente" description={error} /></div>
  if (!c) return <div className="p-7"><SkeletonKpis /></div>

  const colCot: Columna<Cot>[] = [
    { clave: 'numero', titulo: 'Cotización', ancho: '110px', render: (q) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{q.numero}</span> },
    { clave: 'fecha', titulo: 'Fecha', ancho: '100px', render: (q) => formatearFecha(q.fecha) },
    { clave: 'origen', titulo: 'Origen', recortar: true, render: (q) => ORIGEN_COTIZACION[q.origen] ?? q.origen },
    { clave: 'monto', titulo: 'Monto', ancho: '120px', alinear: 'right', render: (q) => <span className="font-mono">{formatearMoneda(q.montoTotal)}</span> },
    { clave: 'estado', titulo: 'Estado', ancho: '130px', render: (q) => <EstadoBadge meta={ESTADO_COTIZACION_META[q.estado]} /> },
    { clave: 'orden', titulo: 'Orden', ancho: '120px', render: (q) => (q.orden ? <Link to={DETALLE.orden(q.orden.id)} className="font-mono whitespace-nowrap text-link hover:underline">{q.orden.codigo}</Link> : '—') },
  ]
  const colOrd: Columna<Ord>[] = [
    { clave: 'codigo', titulo: 'Orden', ancho: '130px', render: (o) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{o.codigo}</span> },
    { clave: 'fecha', titulo: 'Creada', ancho: '100px', render: (o) => formatearFecha(o.fecha) },
    { clave: 'monto', titulo: 'Venta', ancho: '120px', alinear: 'right', render: (o) => (o.monto === null ? '—' : <span className="font-mono">{formatearMoneda(o.monto)}</span>) },
    { clave: 'saldo', titulo: 'Saldo', ancho: '120px', alinear: 'right', render: (o) => (o.saldo === null ? '—' : <span className="font-mono">{formatearMoneda(o.saldo)}</span>) },
    { clave: 'estado', titulo: 'Estado', ancho: '170px', render: (o) => <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} /> },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.clientes} texto="Volver a clientes" />
      <PageHeader
        eyebrow="Venta – Órdenes · Detalle del cliente"
        titulo={c.nombre}
        descripcion={`Documento ${c.documento} · cliente desde ${formatearFecha(c.fechaRegistro)}`}
        acciones={
          <>
            <CambioActivo estado={c.estado} registro={c.nombre} puede={tiene('clientes.cambiar_estado')} onCambiar={(e, conf) => clientesService.cambiarEstado(c.id, e, conf)} onHecho={recargar} />
            {tiene('cotizaciones.registrar') && c.estado === 'activo' && <Link to={`${ROUTES.cotizacionNueva}?cliente=${c.id}`}><Button variant="secondary">Nueva cotización</Button></Link>}
            {tiene('clientes.editar') && <Button onClick={() => setEditando(true)}>Editar cliente</Button>}
          </>
        }
      />
      <StatGrid>
        <StatCard etiqueta="Cotizaciones" valor={String(c.cotizaciones)} detalle="Historial completo" glifo="✦" tono="primary" />
        <StatCard etiqueta="Órdenes en curso" valor={String(c.ordenesEnCurso)} detalle={`${c.ordenes} en total`} glifo="◐" tono="cyan" />
        <StatCard etiqueta="Facturado" valor={formatearMoneda(c.cartera.facturado)} detalle={`${formatearMoneda(c.cartera.abonado)} abonado`} glifo="$" tono="success" />
        <StatCard etiqueta="Saldo pendiente" valor={formatearMoneda(c.cartera.saldo)} detalle="Por cobrar" glifo="!" tono="warning" detalleDestacado={c.cartera.saldo > 0} />
      </StatGrid>
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Bloque titulo="Datos del cliente">
          <div className="flex items-center gap-3">
            <Avatar nombre={c.nombre} tamano="lg" />
            <EstadoBadge meta={ESTADO_REGISTRO_META[c.estado]} />
          </div>
          <Datos columnas={1} items={[
            { label: 'Documento', valor: <span className="font-mono">{c.documento}</span> },
            { label: 'Nombres', valor: c.nombres },
            { label: 'Apellidos', valor: c.apellidos },
            { label: 'Teléfono', valor: c.telefono || '—' },
            { label: 'Dirección', valor: c.direccion || '—' },
            { label: 'Correo', valor: c.correo || '—' },
            { label: 'Fecha de registro', valor: formatearFecha(c.fechaRegistro) },
            { label: 'Portal del cliente', valor: c.tieneCuenta ? 'Tiene cuenta' : 'Sin cuenta' },
          ]} />
        </Bloque>
        <div className="flex flex-col gap-3.5">
          <Card className="flex flex-col overflow-hidden p-0">
            <div className="border-b border-border-base px-5 py-3.5 text-[14px] font-bold text-fg">Historial de cotizaciones</div>
            <DataTable columnas={colCot} filas={c.historialCotizaciones} claveFila={(q) => q.id}
              onAbrir={tiene('cotizaciones.ver_detalle') ? (q) => navigate(DETALLE.cotizacion(q.id)) : undefined}
              vacio={{ titulo: 'Sin cotizaciones', descripcion: 'Este cliente aún no ha pedido cotizaciones.' }} />
          </Card>
          <Card className="flex flex-col overflow-hidden p-0">
            <div className="border-b border-border-base px-5 py-3.5 text-[14px] font-bold text-fg">Órdenes de servicio</div>
            <DataTable columnas={colOrd} filas={c.historialOrdenes} claveFila={(o) => o.id}
              onAbrir={tiene('ordenes.ver_detalle') ? (o) => navigate(DETALLE.orden(o.id)) : undefined}
              vacio={{ titulo: 'Sin órdenes', descripcion: 'Las órdenes nacen de las cotizaciones aprobadas.' }} />
          </Card>
        </div>
      </div>
      <FormCliente abierto={editando} cliente={c} onCerrar={() => setEditando(false)} onGuardado={(x) => { mostrar({ tono: 'exito', mensaje: `Datos de ${x.nombre} actualizados` }); recargar() }} />
    </div>
  )
}
