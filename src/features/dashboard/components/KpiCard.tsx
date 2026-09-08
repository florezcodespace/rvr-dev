import { Card } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import type { Kpi, TonoKpi } from '../types'

const TONOS: Record<TonoKpi, string> = {
  primary: 'bg-primary-soft text-primary-on-soft',
  warning: 'bg-warning-soft text-warning-fg',
  success: 'bg-success-soft text-success-fg',
  info: 'bg-info-soft text-info-fg',
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className="gap-[7px] px-[17px] py-[15px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-fg-muted">{kpi.etiqueta}</span>
        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 flex-none items-center justify-center rounded-[7px] text-[11px] font-bold',
            TONOS[kpi.tono],
          )}
        >
          {kpi.glifo}
        </span>
      </div>

      <div className="text-[29px] leading-none font-bold tracking-[-1px] text-fg">
        {kpi.valor}
        {kpi.valorSecundario && (
          <span className="text-[15px] font-semibold text-fg-subtle">
            {kpi.valorSecundario}
          </span>
        )}
      </div>

      <div
        className={cn(
          'text-[11.5px]',
          kpi.detalleDestacado ? 'font-medium text-warning-fg' : 'text-fg-muted',
        )}
      >
        {kpi.detalle}
      </div>
    </Card>
  )
}
