import { useMemo } from 'react'
import { LeyendaSeries, SerieTemporal } from '@shared/components/charts'
import { Card, CardHeader } from '@shared/components/ui'
import { formatearFechaEje } from '@shared/lib/format'
import { SERIES_ORDENES } from '../seriesOrdenes'
import { OrdenesPorEstado } from './OrdenesPorEstado'
import type { ConteoEstado, PuntoTendencia } from '../types'

export function TendenciaCard({
  tendencia,
  porEstado,
}: {
  tendencia: PuntoTendencia[]
  porEstado: ConteoEstado[]
}) {
  const datos = useMemo(
    () =>
      tendencia.map((punto) => ({
        etiqueta: formatearFechaEje(punto.fecha),
        a: punto.creadas,
        b: punto.completadas,
      })),
    [tendencia],
  )

  return (
    <Card className="gap-4 px-[19px] py-[17px]">
      <CardHeader
        titulo="Tendencia de órdenes"
        subtitulo={`Últimos ${tendencia.length} días · creadas vs. completadas`}
        accion={<LeyendaSeries series={SERIES_ORDENES} />}
      />
      <SerieTemporal
        datos={datos}
        series={SERIES_ORDENES}
        descripcion={`Tendencia de órdenes de los últimos ${tendencia.length} días. Use las flechas para recorrer los días.`}
      />
      <OrdenesPorEstado datos={porEstado} />
    </Card>
  )
}
