import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'

export interface Orbe {
  /**
   * Posición, tamaño y color del orbe en clases de Tailwind
   * (`absolute -top-24 -right-20 size-[380px] bg-indigo-500/20`).
   *
   * El color se pasa desde fuera y no desde aquí a propósito: cada superficie
   * necesita su propia intensidad, y en oscuro casi siempre hace falta más.
   */
  clase: string
  /** Segundos que tarda en completar su recorrido. Entre 22 y 40 se ve natural. */
  duracion?: number
  /** Milisegundos de desfase: dos orbes en fase se leen como un solo latido. */
  retraso?: number
  /** Cuál de los tres recorridos sigue. */
  variante?: 1 | 2 | 3
}

const RECORRIDO = {
  1: 'anim-orbe-1',
  2: 'anim-orbe-2',
  3: 'anim-orbe-3',
} as const

/**
 * Manchas de color desenfocadas que derivan despacio por detrás del contenido.
 *
 * Solo animan `transform`, así que el navegador las resuelve en el compositor y
 * no vuelve a calcular el diseño en ningún cuadro. El contenedor recorta y no
 * recibe puntero: un orbe que se sale de su caja provoca barras de
 * desplazamiento fantasma, y uno que captura clics rompe lo que tiene debajo.
 */
export function Orbes({ orbes, className }: { orbes: Orbe[]; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {orbes.map((orbe, indice) => (
        <span
          key={indice}
          className={cn(
            'absolute rounded-full blur-3xl',
            RECORRIDO[orbe.variante ?? ((indice % 3) + 1) as 1 | 2 | 3],
            orbe.clase,
          )}
          style={varsCss({
            '--duracion': `${orbe.duracion ?? 26 + indice * 4}s`,
            '--retraso': `${orbe.retraso ?? indice * -3200}ms`,
          })}
        />
      ))}
    </div>
  )
}
