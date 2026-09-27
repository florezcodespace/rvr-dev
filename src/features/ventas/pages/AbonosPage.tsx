import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { Listado, type Columna } from '@shared/components/data'
import { FiltroFecha, FiltroSelect } from '@shared/components/form/Campos'
import { IconMas } from '@shared/components/icons'
import { Button, SearchInput } from '@shared/components/ui'
import { METODOS_PAGO } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { ventasService, type Abono } from '../api'
import { ModalAbono } from '../Modales'

const cargar = ventasService.abonos.bind(ventasService)

/** Gestión de Abonos · HU_59 Listar (con total filtrado, CA_59_03) · HU_58 Registrar */
export default function AbonosPage() {
  const { tiene } = useAuth()
  const f = useFiltros(['tipo', 'metodo', 'desde', 'hasta'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [registrando, setRegistrando] = useState(false)

  const columnas: Columna<Abono>[] = [
    { clave: 'fecha', titulo: 'Fecha', ancho: '170px', render: (a) => <span className="font-mono whitespace-nowrap text-[12px] text-fg">{formatearFechaHora(a.fecha)}</span> },
    {
      clave: 'orden', titulo: 'Orden',
      render: (a) => (
        <div className="min-w-0">
          <Link to={DETALLE.orden(a.orden.id)} className="font-mono whitespace-nowrap font-semibold text-link hover:underline">{a.orden.codigo}</Link>
          <div className="truncate text-[11.5px] text-fg-subtle">{a.cliente}{a.ventaAnulada && ' · venta anulada'}</div>
        </div>
      ),
    },
    { clave: 'tipo', titulo: 'Tipo', ancho: '100px', render: (a) => (a.tipo === 'anticipo' ? 'Anticipo' : 'Saldo') },
    { clave: 'metodo', titulo: 'Método', ancho: '130px', render: (a) => a.metodo },
    { clave: 'referencia', titulo: 'Referencia', ancho: '140px', recortar: true, render: (a) => a.referencia || '—' },
    { clave: 'monto', titulo: 'Monto', ancho: '130px', alinear: 'right', render: (a) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{formatearMoneda(a.monto)}</span> },
  ]

  return (
    <>
      <Listado
        eyebrow="Venta – Órdenes"
        titulo="Abonos"
        descripcion="Anticipos y saldos recibidos, con su método de pago y referencia."
        acciones={tiene('abonos.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setRegistrando(true)}>Registrar abono</Button>}
        barra={
          <>
            <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Orden, cliente o referencia…" className="w-full max-w-[240px]" />
            <FiltroSelect etiqueta="Tipo" valor={f.valores.tipo} onChange={(v) => f.set('tipo', v)} opciones={[{ valor: 'anticipo', label: 'Anticipo' }, { valor: 'saldo', label: 'Saldo' }]} />
            <FiltroSelect etiqueta="Método" valor={f.valores.metodo} onChange={(v) => f.set('metodo', v)} opciones={METODOS_PAGO.map((m) => ({ valor: m, label: m }))} />
            <FiltroFecha etiqueta="Desde" valor={f.valores.desde} onChange={(v) => f.set('desde', v)} max={f.valores.hasta || undefined} />
            <FiltroFecha etiqueta="Hasta" valor={f.valores.hasta} onChange={(v) => f.set('hasta', v)} min={f.valores.desde || undefined} />
            {f.hayFiltros && <Button variant="ghost" size="sm" onClick={f.limpiar}>Limpiar</Button>}
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(a) => a.id}
        cargando={cargando}
        error={error}
        vacio={{ titulo: 'Sin abonos', descripcion: 'No hay abonos con esos filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
        pie={datos && (
          <div className="flex items-center justify-end gap-3 border-t border-border-base bg-surface-muted px-4 py-3 text-[13px]">
            <span className="text-fg-muted">Total abonado ({datos.total} {datos.total === 1 ? 'abono' : 'abonos'} filtrados)</span>
            <span className="font-mono whitespace-nowrap text-[16px] font-bold text-fg">{formatearMoneda(datos.totalFiltrado)}</span>
          </div>
        )}
      />
      <ModalAbono abierto={registrando} onCerrar={() => setRegistrando(false)} onHecho={recargar} />
    </>
  )
}
