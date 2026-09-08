import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ESTADO_ORDEN_META } from '@shared/domain/estadoOrden'
import { BarrasRanking, Donut, LeyendaSeries, SerieTemporal } from '@shared/components/charts'
import type { ConfigSeries } from '@shared/components/charts'
import { IconDescargar, IconReportes } from '@shared/components/icons'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  PageHeader,
  Spinner,
  StatCard,
  StatGrid,
  Tabs,
} from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { PENDIENTE_BACKEND } from '@shared/lib/pendiente'
import { formatearDecimal, formatearMoneda, formatearNumero } from '@shared/lib/format'
import { reportesService } from '../api'
import { RANGOS_REPORTE, type RangoReporte } from '../types'

const SERIES: ConfigSeries = {
  a: { label: 'Creadas', color: 'var(--rvr-chart-1)' },
  b: { label: 'Completadas', color: 'var(--rvr-chart-2)' },
}

const ETIQUETAS: Record<RangoReporte, string> = {
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  '6m': 'Últimos 6 meses',
  '12m': 'Últimos 12 meses',
}

const cargar = reportesService.resumen.bind(reportesService)

export default function ReportesPage() {
  const [params, setParams] = useSearchParams()
  const rangoUrl = params.get('rango') as RangoReporte | null
  const rango: RangoReporte =
    rangoUrl && RANGOS_REPORTE.includes(rangoUrl) ? rangoUrl : '6m'

  const consulta = useMemo(() => ({ rango }), [rango])
  const { datos, error } = useRecurso(cargar, consulta)

  const cambiarRango = (siguiente: RangoReporte) => {
    const nuevos = new URLSearchParams()
    if (siguiente !== '6m') nuevos.set('rango', siguiente)
    setParams(nuevos, { replace: true })
  }

  if (error) {
    return (
      <div className="p-7">
        <Alert tone="danger" title={error} description="Inténtalo de nuevo en un momento." />
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="flex h-full items-center justify-center text-fg-subtle">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-7 py-6">
      <PageHeader
        titulo="Reportes"
        descripcion={`Resultados operativos del ${datos.desde} al ${datos.hasta}`}
        acciones={
          <>
            <Button
              variant="secondary"
              disabled
              title={PENDIENTE_BACKEND}
              leadingIcon={<IconDescargar />}
            >
              Exportar PDF
            </Button>
            <Button disabled title={PENDIENTE_BACKEND} leadingIcon={<IconReportes />}>
              Programar envío
            </Button>
          </>
        }
      />

      {/* El rango es el filtro que más se toca: va en pestañas, a un clic. */}
      <Tabs
        etiqueta="Rango del reporte"
        valor={rango}
        onChange={cambiarRango}
        opciones={RANGOS_REPORTE.map((valor) => ({ valor, label: ETIQUETAS[valor] }))}
      />

      <StatGrid>
        <StatCard
          etiqueta="Órdenes completadas"
          valor={formatearNumero(datos.completadas)}
          detalle={`${datos.cumplimientoSla} % dentro del SLA`}
          glifo="✓"
          tono="success"
        />
        <StatCard
          etiqueta="Ingresos del período"
          valor={formatearMoneda(datos.ingresos)}
          detalle={`+${datos.variacionIngresos} % frente al período anterior`}
          glifo="◆"
          tono="primary"
        />
        <StatCard
          etiqueta="Tiempo medio de cierre"
          valor={`${formatearDecimal(datos.tiempoCierre)} días`}
          detalle={`${formatearDecimal(datos.variacionTiempo)} días frente al período anterior`}
          glifo="◷"
          tono="cyan"
        />
        <StatCard
          etiqueta="Satisfacción del cliente"
          valor={`${formatearDecimal(datos.satisfaccion)} / 5`}
          detalle={`Sobre ${datos.encuestas} encuestas respondidas`}
          glifo="◈"
          tono="info"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="gap-4 px-[19px] py-[17px]">
          <CardHeader
            titulo="Órdenes creadas y completadas"
            subtitulo="Serie quincenal del período seleccionado"
            accion={<LeyendaSeries series={SERIES} />}
          />
          <SerieTemporal
            datos={datos.serie.map((p) => ({
              etiqueta: p.etiqueta,
              a: p.creadas,
              b: p.completadas,
            }))}
            series={SERIES}
            descripcion="Órdenes creadas y completadas por quincena. Use las flechas para recorrer el período."
          />
        </Card>

        <Card className="gap-4 px-[19px] py-[17px]">
          <CardHeader titulo="Órdenes por estado" subtitulo="Total del período" />
          <Donut
            etiquetaTotal="órdenes"
            segmentos={datos.porEstado.map((item) => ({
              clave: item.estado,
              label: ESTADO_ORDEN_META[item.estado].label,
              valor: item.cantidad,
              color: ESTADO_ORDEN_META[item.estado].color,
            }))}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card className="gap-[13px] px-[19px] py-[17px]">
          <CardHeader
            titulo="Servicios más solicitados"
            subtitulo="Cantidad de órdenes por servicio"
          />
          <BarrasRanking
            items={datos.servicios.map((s) => ({
              clave: s.id,
              nombre: s.nombre,
              valor: s.cantidad,
            }))}
          />
        </Card>

        <Card className="gap-[13px] px-[19px] py-[17px]">
          <CardHeader
            titulo="Órdenes cerradas por técnico"
            subtitulo="Período completo · top 5"
          />
          <BarrasRanking
            color="var(--rvr-chart-2)"
            items={datos.tecnicos.map((t) => ({
              clave: t.id,
              nombre: t.nombre,
              valor: t.cerradas,
            }))}
          />
        </Card>
      </div>

      <p className="m-0 text-center text-[11.5px] text-fg-subtle">
        Los datos se actualizan cada hora.
      </p>
    </div>
  )
}
