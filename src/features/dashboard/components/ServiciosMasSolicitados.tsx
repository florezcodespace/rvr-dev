import { BarrasRanking } from '@shared/components/charts'
import { Card, CardHeader } from '@shared/components/ui'
import type { ServicioSolicitado } from '../types'

export function ServiciosMasSolicitados({ datos }: { datos: ServicioSolicitado[] }) {
  return (
    <Card className="gap-[13px] px-[19px] py-[17px]">
      <CardHeader titulo="Servicios más solicitados" />
      <BarrasRanking
        items={datos.map((s) => ({ clave: s.id, nombre: s.nombre, valor: s.cantidad }))}
      />
    </Card>
  )
}
