import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { AccionesFila, EstadoBadge, Listado, type Columna } from '@shared/components/data'
import { FiltroFecha } from '@shared/components/form/Campos'
import { IconMas, IconVer } from '@shared/components/icons'
import { Button, SearchInput, StatCard, StatGrid, Tabs } from '@shared/components/ui'
import { ESTADO_PAGO_META } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { ventasService, type Venta } from '../api'
import { ModalVenta } from '../Modales'

const cargar = ventasService.listar.bind(ventasService)

/** Gestión de Ventas · HU_56 Estado de pago de cada venta · HU_55 Registrar venta */
export default function VentasPage() {
  const { tiene } = useAuth()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'desde', 'hasta'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [registrando, setRegistrando] = useState(false)

  const columnas: Columna<Venta>[] = [
    {
      clave: 'orden', titulo: 'Orden',
      render: (v) => (
        <div className="min-w-0">
          <Link to={DETALLE.orden(v.orden.id)} className="font-mono whitespace-nowrap font-semibold text-link hover:underline">{v.orden.codigo}</Link>
          <div className="truncate text-[11.5px] text-fg-subtle">{v.cliente?.nombre ?? '—'}</div>
        </div>
      ),
    },
    { clave: 'fecha', titulo: 'Fecha', ancho: '100px', render: (v) => formatearFecha(v.fecha) },
    { clave: 'total', titulo: 'Total', ancho: '120px', alinear: 'right', render: (v) => <span className="font-mono whitespace-nowrap text-fg">{formatearMoneda(v.montoTotal)}</span> },
    { clave: 'anticipo', titulo: 'Anticipo', ancho: '120px', alinear: 'right', render: (v) => <span className={v.anticipoCubierto ? 'font-mono text-success-fg' : 'font-mono text-warning-fg'}>{formatearMoneda(v.montoAnticipo)}</span> },
    { clave: 'abonado', titulo: 'Abonado', ancho: '120px', alinear: 'right', render: (v) => <span className="font-mono">{formatearMoneda(v.abonado)}</span> },
    { clave: 'saldo', titulo: 'Saldo', ancho: '120px', alinear: 'right', render: (v) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{formatearMoneda(v.saldo)}</span> },
    { clave: 'estado', titulo: 'Estado de pago', ancho: '170px', render: (v) => <EstadoBadge meta={ESTADO_PAGO_META[v.estadoPago]} /> },
    { clave: 'acciones', titulo: '', ancho: '56px', alinear: 'right', render: (v) => <AccionesFila acciones={[{ clave: 'ver', etiqueta: `Estado de pago de ${v.orden.codigo}`, icono: <IconVer />, a: DETALLE.venta(v.id) }]} /> },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Venta – Órdenes"
        titulo="Ventas"
        descripcion="Valor acordado de cada orden, su anticipo del 50 %, lo abonado y el saldo pendiente."
        acciones={tiene('ventas.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setRegistrando(true)}>Registrar venta</Button>}
        indicadores={c && (
          <StatGrid>
            <StatCard etiqueta="Cartera por cobrar" valor={formatearMoneda(c.cartera)} detalle="Saldo de ventas vigentes" glifo="$" tono="warning" />
            <StatCard etiqueta="Sin anticipo" valor={String(c.pendiente_anticipo)} detalle="No pueden iniciar" glifo="⏱" tono="danger" detalleDestacado={c.pendiente_anticipo > 0} />
            <StatCard etiqueta="Abonadas" valor={String(c.abonada)} detalle="Con saldo pendiente" glifo="◐" tono="info" />
            <StatCard etiqueta="Pagadas" valor={String(c.pagada)} detalle="Saldo en cero" glifo="✓" tono="success" />
          </StatGrid>
        )}
        barra={
          <>
            <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Código de orden o cliente…" className="w-full max-w-[260px]" />
            <Tabs etiqueta="Estado de pago" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[
                { valor: 'todos', label: 'Todas', conteo: c?.todos },
                { valor: 'pendiente_anticipo', label: 'Sin anticipo', conteo: c?.pendiente_anticipo },
                { valor: 'abonada', label: 'Abonadas', conteo: c?.abonada },
                { valor: 'pagada', label: 'Pagadas', conteo: c?.pagada },
                { valor: 'anulada', label: 'Anuladas', conteo: c?.anulada },
              ]} />
            <FiltroFecha etiqueta="Desde" valor={f.valores.desde} onChange={(v) => f.set('desde', v)} />
            <FiltroFecha etiqueta="Hasta" valor={f.valores.hasta} onChange={(v) => f.set('hasta', v)} />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(v) => v.id}
        cargando={cargando}
        error={error}
        onAbrir={(v) => navigate(DETALLE.venta(v.id))}
        vacio={{ titulo: 'Sin ventas', descripcion: 'No hay ventas con esos filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      <ModalVenta abierto={registrando} onCerrar={() => setRegistrando(false)} onHecho={(id) => { recargar(); navigate(DETALLE.venta(id)) }} />
    </>
  )
}
