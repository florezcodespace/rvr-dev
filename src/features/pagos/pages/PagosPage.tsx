import { useCallback } from 'react'
import { ESTADO_PAGO_META, TRANSICIONES_PAGO } from '@shared/domain/estados'
import { IconDescargar, IconMas } from '@shared/components/icons'
import { DataTable, Pager, SelectorEstado } from '@shared/components/data'
import type { Columna } from '@shared/components/data'
import {
  Alert,
  Button,
  Card,
  PageHeader,
  SearchInput,
  StatCard,
  StatGrid,
  Tabs,
} from '@shared/components/ui'
import { useCambioEstado } from '@shared/hooks/useCambioEstado'
import { useListaParams } from '@shared/hooks/useListaParams'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearMoneda } from '@shared/lib/format'
import { textoPagina } from '@shared/lib/paginar'
import { pagosService } from '../api'
import { MediosPago } from '../components/MediosPago'
import { RecaudoMensual } from '../components/RecaudoMensual'
import { MEDIO_PAGO_CORTO, TABS_PAGO, type Pago, type TabPago } from '../types'

const ETIQUETAS: Record<TabPago, string> = {
  todos: 'Todos',
  por_conciliar: 'Por conciliar',
  conciliados: 'Conciliados',
  vencidos: 'Vencidos',
}

const FECHA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const cargar = pagosService.listar.bind(pagosService)

export default function PagosPage() {
  const { tab, q, params, setTab, setQ, setPagina } = useListaParams<TabPago>(
    'todos',
    TABS_PAGO,
  )
  const { datos, cargando, error } = useRecurso(cargar, params)

  const guardar = useCallback(
    (id: number, estado: Parameters<typeof pagosService.cambiarEstado>[1]) =>
      pagosService.cambiarEstado(id, estado),
    [],
  )
  const { estadoDe, cambiar } = useCambioEstado(guardar, ESTADO_PAGO_META)

  if (error) {
    return (
      <div className="p-7">
        <Alert tone="danger" title={error} description="Inténtalo de nuevo en un momento." />
      </div>
    )
  }

  const resumen = datos?.resumen
  const lista = datos?.pagina

  const columnas: Columna<Pago>[] = [
    {
      clave: 'recibo',
      titulo: 'Recibo',
      ancho: '100px',
      render: (p) => (
        <span className="font-mono text-[12px] font-medium text-primary-on-soft">
          {p.recibo}
        </span>
      ),
    },
    {
      clave: 'cliente',
      titulo: 'Cliente',
      render: (p) => <span className="font-semibold text-fg">{p.clienteNombre}</span>,
    },
    {
      clave: 'orden',
      titulo: 'Orden',
      ancho: '96px',
      render: (p) => <span className="font-mono text-[12px]">{p.ordenCodigo}</span>,
    },
    {
      clave: 'valor',
      titulo: 'Valor',
      ancho: '124px',
      alinear: 'right',
      render: (p) => (
        <span className="font-mono text-[12px] text-fg">{formatearMoneda(p.valor)}</span>
      ),
    },
    {
      clave: 'medio',
      titulo: 'Medio',
      ancho: '124px',
      render: (p) => MEDIO_PAGO_CORTO[p.medio],
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      ancho: '186px',
      render: (p) => {
        const actual = estadoDe(p.id, p.estado)
        return (
          <SelectorEstado
            valor={actual}
            meta={ESTADO_PAGO_META}
            transiciones={TRANSICIONES_PAGO[actual]}
            registro={p.recibo}
            onCambiar={(destino) => cambiar(p.id, destino, actual, p.recibo)}
          />
        )
      },
    },
    {
      clave: 'fecha',
      titulo: 'Fecha',
      ancho: '104px',
      render: (p) => FECHA.format(new Date(`${p.fecha}T12:00:00`)),
    },
  ]

  return (
    <div className="flex flex-col gap-4 px-7 py-6">
      <PageHeader
        titulo="Pagos"
        descripcion={
          resumen
            ? `${resumen.porConciliar} pagos por conciliar equivalentes a ${formatearMoneda(resumen.valorPorConciliar)}`
            : 'Cargando…'
        }
        acciones={
          <>
            <Button variant="secondary" leadingIcon={<IconDescargar />}>
              Exportar
            </Button>
            <Button leadingIcon={<IconMas />}>Registrar pago</Button>
          </>
        }
      />

      {resumen && (
        <StatGrid>
          <StatCard
            etiqueta="Recaudado en el mes"
            valor={formatearMoneda(resumen.recaudadoMes)}
            detalle={`${Math.round((resumen.recaudadoMes / resumen.metaMes) * 100)} % de la meta mensual`}
            glifo="✓"
            tono="success"
          />
          <StatCard
            etiqueta="Por conciliar"
            valor={String(resumen.porConciliar)}
            detalle={`${formatearMoneda(resumen.valorPorConciliar)} pendientes`}
            detalleDestacado
            glifo="⏱"
            tono="warning"
          />
          <StatCard
            etiqueta="Vencidos"
            valor={String(resumen.vencidos)}
            detalle={`${formatearMoneda(resumen.valorVencidos)} con mora`}
            glifo="!"
            tono="danger"
          />
          <StatCard
            etiqueta="Días de cobro"
            valor={String(resumen.diasCobro)}
            detalle="-4 días frente a agosto"
            glifo="◆"
            tono="primary"
          />
        </StatGrid>
      )}

      {datos && (
        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.4fr_1fr]">
          <RecaudoMensual datos={datos.recaudo} meta={datos.resumen.metaMes} />
          <MediosPago datos={datos.medios} />
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
          <Tabs
            etiqueta="Filtrar pagos"
            valor={tab}
            onChange={setTab}
            opciones={TABS_PAGO.map((valor) => ({
              valor,
              label: ETIQUETAS[valor],
              conteo: datos?.conteos[valor],
            }))}
          />
          <SearchInput
            valor={q}
            onChange={setQ}
            placeholder="Buscar pago u orden"
            className="ml-auto w-full max-w-[240px]"
          />
        </div>

        <DataTable
          columnas={columnas}
          filas={lista?.items ?? []}
          claveFila={(p) => p.id}
          cargando={cargando}
          vacio={{
            titulo: 'Ningún pago coincide',
            descripcion: 'Cambia de pestaña o ajusta la búsqueda.',
          }}
        />

        {lista && (
          <Pager
            pagina={lista.pagina}
            totalPaginas={lista.totalPaginas}
            info={textoPagina(lista, 'pagos')}
            onPagina={setPagina}
          />
        )}
      </Card>
    </div>
  )
}
