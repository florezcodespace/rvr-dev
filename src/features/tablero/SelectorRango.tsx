import { FiltroFecha } from '@shared/components/form/Campos'
import { Tabs } from '@shared/components/ui'
import { hoyISO, sumarDias } from '@shared/lib/fechas'

const PRESETS = [
  { valor: '7', label: '7 días' },
  { valor: '30', label: '30 días' },
  { valor: '90', label: '90 días' },
  { valor: '365', label: '12 meses' },
] as const

/** Rango de fechas personalizable (CA_65_04, CA_63_03, CA_64_03, CA_60_01). */
export function SelectorRango({ desde, hasta, onCambiar }: { desde: string; hasta: string; onCambiar: (desde: string, hasta: string) => void }) {
  const preset = hasta === hoyISO() ? PRESETS.find((p) => sumarDias(hoyISO(), -(Number(p.valor) - 1)) === desde)?.valor : undefined
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Tabs etiqueta="Período" valor={preset ?? 'personalizado'} onChange={(v) => v !== 'personalizado' && onCambiar(sumarDias(hoyISO(), -(Number(v) - 1)), hoyISO())}
        opciones={[...PRESETS.map((p) => ({ valor: p.valor as string, label: p.label })), { valor: 'personalizado', label: 'Personalizado' }]} />
      <FiltroFecha etiqueta="Desde" valor={desde} max={hasta} onChange={(v) => v && onCambiar(v, hasta)} />
      <FiltroFecha etiqueta="Hasta" valor={hasta} min={desde} onChange={(v) => v && onCambiar(desde, v)} />
    </div>
  )
}

