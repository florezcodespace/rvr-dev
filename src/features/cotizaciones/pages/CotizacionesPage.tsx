import { useCallback } from 'react'
import {
  ESTADO_COTIZACION_META,
  TRANSICIONES_COTIZACION,
} from '@shared/domain/estados'
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
import { cotizacionesService } from '../api'
import { TABS_COTIZACION, type Cotizacion, type TabCotizacion } from '../types'

const ETIQUETAS: Record<TabCotizacion, string> = {
  todas: 'Todas',
  nuevas: 'Nuevas',
  pendientes: 'Pendientes',
  aprobadas: 'Aprobadas',
  canceladas: 'Canceladas',
}

const FECHA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const cargar = cotizacionesService.listar.bind(cotizacionesService)

export default function CotizacionesPage() {
  const { tab, q, params, setTab, setQ, setPagina } =
    useListaParams<TabCotizacion>('todas', TABS_COTIZACION)

  const { datos, cargando, error } = useRecurso(cargar, params)

  const guardar = useCallback(
    (id: number, estado: Parameters<typeof cotizacionesService.cambiarEstado>[1]) =>
      cotizacionesService.cambiarEstado(id, estado),
    [],
  )
  const { estadoDe, cambiar } = useCambioEstado(guardar, ESTADO_COTIZACION_META)

  if (error) {
    return (
      <div className="p-7">
        <Alert tone="danger" title={error} description="Inténtalo de nuevo en un momento." />
      </div>
    )
  }

  const resumen = datos?.resumen
  const lista = datos?.pagina

  const columnas: Columna<Cotizacion>[] = [
    {
      clave: 'codigo',
      titulo: 'Código',
      ancho: '104px',
      render: (c) => (
        <span className="font-mono text-[12px] font-medium text-primary-on-soft">
          {c.codigo}
        </span>
      ),
    },
    {
      clave: 'cliente',
      titulo: 'Cliente',
      render: (c) => <span className="font-semibold text-fg">{c.clienteNombre}</span>,
    },
    { clave: 'servicio', titulo: 'Servicio', render: (c) => c.servicioNombre },
    {
      clave: 'valor',
      titulo: 'Valor',
      ancho: '128px',
      alinear: 'right',
      render: (c) => (
        <span className="font-mono text-[12px] text-fg">{formatearMoneda(c.valorTotal)}</span>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      ancho: '158px',
      render: (c) => {
        const actual = estadoDe(c.id, c.estado)
        return (
          <SelectorEstado
            valor={actual}
            meta={ESTADO_COTIZACION_META}
            transiciones={TRANSICIONES_COTIZACION[actual]}
            registro={c.codigo}
            onCambiar={(destino) => cambiar(c.id, destino, actual, c.codigo)}
          />
        )
      },
    },
    {
      clave: 'vigencia',
      titulo: 'Vigencia',
      ancho: '110px',
      render: (c) => FECHA.format(new Date(`${c.vigencia}T12:00:00`)),
    },
  ]

  return (
    <div className="flex h-full flex-col gap-4 px-7 py-6">
      <PageHeader
        titulo="Cotizaciones"
        descripcion={
          resumen
            ? `${resumen.enNegociacion} cotizaciones en negociación por ${formatearMoneda(resumen.valorEnNegociacion)}`
            : 'Cargando…'
        }
        acciones={
          <>
            <Button variant="secondary" leadingIcon={<IconDescargar />}>
              Exportar
            </Button>
            <Button leadingIcon={<IconMas />}>Nueva cotización</Button>
          </>
        }
      />

      {resumen && (
        <StatGrid>
          <StatCard
            etiqueta="En negociación"
            valor={String(resumen.enNegociacion)}
            detalle={`${formatearMoneda(resumen.valorEnNegociacion)} en juego`}
            glifo="◈"
            tono="primary"
          />
          <StatCard
            etiqueta="Aprobadas"
            valor={String(resumen.aprobadasMes)}
            detalle={`${resumen.tasaCierre} % de tasa de cierre`}
            glifo="✓"
            tono="success"
          />
          <StatCard
            etiqueta="Por vencer"
            valor={String(resumen.porVencer)}
            detalle="Vencen en menos de 5 días"
            detalleDestacado
            glifo="⏱"
            tono="warning"
          />
          <StatCard
            etiqueta="Ticket promedio"
            valor={formatearMoneda(resumen.ticketPromedio)}
            detalle="Sobre todas las cotizaciones"
            glifo="◆"
            tono="info"
          />
        </StatGrid>
      )}

      <Card className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
          <Tabs
            etiqueta="Filtrar cotizaciones por estado"
            valor={tab}
            onChange={setTab}
            opciones={TABS_COTIZACION.map((valor) => ({
              valor,
              label: ETIQUETAS[valor],
              conteo: datos?.conteos[valor],
            }))}
          />
          <SearchInput
            valor={q}
            onChange={setQ}
            placeholder="Buscar cotización"
            className="ml-auto w-full max-w-[260px]"
          />
        </div>

        <DataTable
          columnas={columnas}
          filas={lista?.items ?? []}
          claveFila={(c) => c.id}
          cargando={cargando}
          vacio={{
            titulo: 'Ninguna cotización coincide',
            descripcion: 'Prueba con otra pestaña o cambia el texto de búsqueda.',
          }}
        />

        {lista && (
          <Pager
            pagina={lista.pagina}
            totalPaginas={lista.totalPaginas}
            info={textoPagina(lista, 'cotizaciones')}
            onPagina={setPagina}
          />
        )}
      </Card>
    </div>
  )
}
