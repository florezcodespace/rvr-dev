import { Card } from '@shared/components/ui'
import type { BloqueAgenda } from '../types'

export function AgendaTecnico({
  nombre,
  bloques,
}: {
  nombre: string | undefined
  bloques: BloqueAgenda[] | null
}) {
  return (
    <Card className="gap-3 px-5 py-[18px]">
      <h2 className="m-0 text-[13.5px] font-bold tracking-[-0.2px] text-fg">
        {nombre ? `Agenda de ${nombre}` : 'Agenda del técnico'}
      </h2>

      {!nombre || !bloques ? (
        <p className="m-0 text-[12px] text-fg-subtle">
          Selecciona un técnico para ver sus franjas del día según
          <span className="font-mono text-[11.5px]"> horarios_tecnicos</span>.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {bloques.map((bloque) => (
            <li key={bloque.hora} className="flex items-center gap-2.5">
              <span className="w-11 flex-none font-mono text-[11px] font-medium text-fg-subtle">
                {bloque.hora}
              </span>
              {bloque.ocupadoPor ? (
                <span className="flex h-[26px] flex-1 items-center truncate rounded-[7px] border-l-[3px] border-primary bg-primary-soft px-[9px] text-[11.5px] font-semibold text-primary-on-soft">
                  {bloque.ocupadoPor}
                </span>
              ) : (
                <span className="flex h-[26px] flex-1 items-center rounded-[7px] border border-dashed border-border-strong bg-bg px-[9px] text-[11.5px] text-fg-subtle">
                  Disponible
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
