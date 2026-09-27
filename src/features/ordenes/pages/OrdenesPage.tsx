import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { AccionesFila, EstadoBadge, Listado, type Columna } from '@shared/components/data'
import { FiltroFecha, FiltroSelect } from '@shared/components/form/Campos'
import { IconMas, IconVer } from '@shared/components/icons'
import { Button, SearchInput, Tabs } from '@shared/components/ui'
import { ESTADO_ORDEN_META, ESTADO_PAGO_META } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFecha, formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { ordenesService, type OrdenResumen } from '../api'

const cargar = ordenesService.listar.bind(ordenesService)

/** HU_46 Listar (CA_46_01: código, cliente, fecha, monto y estado) · HU_45 Buscar */
export default function OrdenesPage() {
  const { tiene } = useAuth()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'tecnico', 'desde', 'hasta', 'orden'] as const, { orden: 'fecha' })
  const { datos, cargando, error } = useRecurso(cargar, f.params)
  const [tecnicos, setTecnicos] = useState<{ id: number; nombre: string }[]>([])
  useEffect(() => { ordenesService.tecnicos().then(setTecnicos).catch(() => undefined) }, [])

  const columnas: Columna<OrdenResumen>[] = [
    {
      clave: 'codigo', titulo: 'Orden',
      render: (o) => (
        <div className="min-w-0">
          <div className="font-mono whitespace-nowrap font-semibold text-fg">{o.codigo}</div>
          <div className="truncate text-[11.5px] text-fg-subtle">{o.servicios || '—'}</div>
        </div>
      ),
    },
    { clave: 'cliente', titulo: 'Cliente', recortar: true, render: (o) => o.cliente?.nombre ?? '—' },
    { clave: 'fecha', titulo: 'Creada', ancho: '100px', render: (o) => formatearFecha(o.fechaCreacion) },
    {
      clave: 'tecnico', titulo: 'Técnico / visita', ancho: '170px',
      render: (o) => (
        <div className="min-w-0">
          <div className="truncate text-fg">{o.tecnico?.nombre ?? <span className="text-fg-faint">Sin agendar</span>}</div>
          {o.proximaVisita && <div className="text-[11px] text-fg-subtle">{formatearFechaHora(o.proximaVisita)}</div>}
        </div>
      ),
    },
    {
      clave: 'venta', titulo: 'Venta', ancho: '150px', alinear: 'right',
      render: (o) => (o.montoVenta === null ? <span className="text-fg-faint">Sin venta</span> : (
        <div>
          <div className="font-mono whitespace-nowrap text-fg">{formatearMoneda(o.montoVenta)}</div>
          {o.estadoPago && <div className="text-[10.5px] font-semibold text-fg-subtle">{ESTADO_PAGO_META[o.estadoPago].labelCorto}</div>}
        </div>
      )),
    },
    { clave: 'estado', titulo: 'Estado', ancho: '180px', render: (o) => <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} /> },
    { clave: 'acciones', titulo: '', ancho: '56px', alinear: 'right', render: (o) => tiene('ordenes.ver_detalle') && <AccionesFila acciones={[{ clave: 'ver', etiqueta: `Ver ${o.codigo}`, icono: <IconVer />, a: DETALLE.orden(o.id) }]} /> },
  ]

  const c = datos?.conteos
  return (
    <Listado
      eyebrow="Venta – Órdenes"
      titulo="Órdenes de servicio"
      descripcion="Trabajos generados desde las cotizaciones aprobadas, con su ejecución, visitas y estado de pago."
      acciones={tiene('ordenes.registrar') && <Button leadingIcon={<IconMas />} onClick={() => navigate(ROUTES.ordenNueva)}>Registrar orden</Button>}
      barra={
        <>
          {tiene('ordenes.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Código, cliente o técnico…" className="w-full max-w-[240px]" />}
          <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
            opciones={[
              { valor: 'todos', label: 'Todas', conteo: c?.todos },
              { valor: 'esperando_anticipo', label: 'Esperando anticipo', conteo: c?.esperando_anticipo },
              { valor: 'en_proceso', label: 'En proceso', conteo: c?.en_proceso },
              { valor: 'en_espera_repuesto', label: 'Espera repuesto', conteo: c?.en_espera_repuesto },
              { valor: 'finalizada', label: 'Finalizadas', conteo: c?.finalizada },
              { valor: 'cancelada', label: 'Canceladas', conteo: c?.cancelada },
            ]} />
          <FiltroSelect etiqueta="Técnico" valor={f.valores.tecnico} onChange={(v) => f.set('tecnico', v)} opciones={tecnicos.map((t) => ({ valor: String(t.id), label: t.nombre }))} />
          <FiltroFecha etiqueta="Desde" valor={f.valores.desde} onChange={(v) => f.set('desde', v)} max={f.valores.hasta || undefined} />
          <FiltroFecha etiqueta="Hasta" valor={f.valores.hasta} onChange={(v) => f.set('hasta', v)} min={f.valores.desde || undefined} />
          <FiltroSelect etiqueta="Ordenar" valor={f.valores.orden === 'fecha' ? '' : f.valores.orden} onChange={(v) => f.set('orden', v || 'fecha')} opciones={[{ valor: 'estado', label: 'Por estado' }]} todos="Por fecha" />
          {f.hayFiltros && <Button variant="ghost" size="sm" onClick={f.limpiar}>Limpiar</Button>}
        </>
      }
      columnas={columnas}
      filas={datos?.items ?? []}
      claveFila={(o) => o.id}
      cargando={cargando}
      error={error}
      onAbrir={tiene('ordenes.ver_detalle') ? (o) => navigate(DETALLE.orden(o.id)) : undefined}
      vacio={{ titulo: 'No se encontraron órdenes', descripcion: 'Prueba con otro término o cambia los filtros.' }}
      pagina={datos ?? undefined}
      onPagina={f.setPagina}
    />
  )
}
