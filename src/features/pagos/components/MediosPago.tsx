import { Card, CardHeader } from '@shared/components/ui'
import { MEDIO_PAGO_LABEL, type MedioPago } from '../types'

const COLOR: Record<MedioPago, string> = {
  transferencia: 'var(--rvr-cat-1)',
  tarjeta: 'var(--rvr-cat-2)',
  efectivo: 'var(--rvr-cat-3)',
  otro: 'var(--rvr-cat-4)',
}

export function MediosPago({
  datos,
}: {
  datos: { medio: MedioPago; porcentaje: number }[]
}) {
  return (
    <Card className="gap-[13px] px-[19px] py-[17px]">
      <CardHeader titulo="Medios de pago" subtitulo="Distribución del recaudo del mes" />

      <ul className="flex list-none flex-col gap-[11px] p-0">
        {datos.map(({ medio, porcentaje }) => (
          <li key={medio}>
            <div className="mb-[5px] flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-2 font-medium text-fg">
                <span
                  aria-hidden="true"
                  className="size-2 flex-none rounded-full"
                  style={{ background: COLOR[medio] }}
                />
                {MEDIO_PAGO_LABEL[medio]}
              </span>
              <span className="font-semibold text-fg-muted">{porcentaje} %</span>
            </div>
            <div className="h-[7px] rounded-[4px] bg-surface-muted">
              <div
                className="h-[7px] rounded-[4px]"
                style={{ width: `${porcentaje}%`, background: COLOR[medio] }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
