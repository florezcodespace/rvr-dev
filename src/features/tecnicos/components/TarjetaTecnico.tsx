import { ESTADO_TECNICO_META, TRANSICIONES_TECNICO } from '@shared/domain/estados'
import type { EstadoTecnico } from '@shared/domain/estados'
import { SelectorEstado } from '@shared/components/data'
import { Avatar, Card, Chip } from '@shared/components/ui'
import type { Tecnico } from '../types'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11.5px]">
      <span className="text-fg-subtle">{etiqueta}</span>
      <span className="font-semibold text-fg">{valor}</span>
    </div>
  )
}

export function TarjetaTecnico({
  tecnico,
  estado,
  onCambiarEstado,
}: {
  tecnico: Tecnico
  estado: EstadoTecnico
  onCambiarEstado: (destino: EstadoTecnico) => void
}) {
  return (
    <Card className="gap-3 px-[17px] py-4">
      <div className="flex items-start gap-2.5">
        <Avatar nombre={tecnico.nombre} tamano="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold tracking-[-0.2px] text-fg">
            {tecnico.nombre}
          </div>
          <div className="text-[11.5px] text-fg-subtle">{tecnico.especialidad}</div>
        </div>
      </div>

      {/* El estado va en su propia línea: el nombre nunca se corta por el badge. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <SelectorEstado
          valor={estado}
          meta={ESTADO_TECNICO_META}
          transiciones={TRANSICIONES_TECNICO[estado]}
          registro={tecnico.nombre}
          onCambiar={onCambiarEstado}
        />
        {tecnico.habilidades.map((habilidad) => (
          <Chip key={habilidad}>{habilidad}</Chip>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border-base pt-3">
        <Dato
          etiqueta="Carga de hoy"
          valor={`${tecnico.ordenesHoy} ${tecnico.ordenesHoy === 1 ? 'orden' : 'órdenes'}`}
        />
        <Dato etiqueta="Cumplimiento SLA" valor={`${tecnico.cumplimientoSla} %`} />
        <Dato etiqueta="Zona" valor={tecnico.zona} />
      </div>
    </Card>
  )
}
