import { Card } from '@shared/components/ui'
import { formatearMoneda } from '@shared/lib/format'

interface Props {
  codigo: string
  cliente?: string
  servicio?: string
  tecnico?: string
  valor: number | null
}

function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 text-[12.5px]">
      <span className="text-fg-muted">{etiqueta}</span>
      <span className="truncate text-right font-semibold text-fg">{valor}</span>
    </div>
  )
}

export function ResumenOrden({ codigo, cliente, servicio, tecnico, valor }: Props) {
  return (
    <Card className="gap-[13px] px-5 py-[18px]">
      <h2 className="m-0 text-[13.5px] font-bold tracking-[-0.2px] text-fg">
        Resumen de la orden
      </h2>

      <div className="flex justify-between gap-3 text-[12.5px]">
        <span className="text-fg-muted">Consecutivo</span>
        <span className="font-mono text-[12px] font-medium text-fg">{codigo}</span>
      </div>

      <Linea etiqueta="Cliente" valor={cliente ?? '—'} />
      <Linea etiqueta="Servicio" valor={servicio ?? '—'} />
      <Linea etiqueta="Técnico" valor={tecnico ?? 'Sin asignar'} />

      <div className="flex justify-between gap-3 border-t border-border-base pt-[11px] text-[12.5px]">
        <span className="text-fg-muted">Valor cotizado</span>
        <span className="text-[14px] font-bold text-fg">
          {valor === null ? '—' : formatearMoneda(valor)}
        </span>
      </div>

      <div className="flex items-start gap-[9px] rounded-[9px] border border-[var(--rvr-estado-programada)]/35 bg-[var(--rvr-estado-programada-soft)] px-3 py-2.5">
        <span
          aria-hidden="true"
          className="mt-px flex size-4 flex-none items-center justify-center rounded-full bg-[var(--rvr-estado-programada)] text-[10px] font-bold text-white"
        >
          i
        </span>
        <span className="text-[11.5px] leading-[1.5] text-fg-muted">
          Al crear la orden se notifica al técnico y se genera el agendamiento
          correspondiente.
        </span>
      </div>
    </Card>
  )
}
