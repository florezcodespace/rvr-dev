import type { ReactNode } from 'react'
import { varsCss } from '@shared/lib/varsCss'
import { TextoAnimado } from './TextoAnimado'

/**
 * Encabezado común de las vistas. El título pesa más que antes (26 px) y lleva
 * una línea superior opcional: con todo al mismo tamaño, las pantallas se leían
 * como un formulario y no como una vista con jerarquía.
 */
export function PageHeader({
  eyebrow,
  titulo,
  descripcion,
  acciones,
}: {
  /** Línea pequeña en mayúsculas sobre el título (módulo, fecha, contexto). */
  eyebrow?: ReactNode
  titulo: string
  descripcion: ReactNode
  acciones?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="anim-entrada mb-1.5 text-[12.5px] font-semibold text-primary-on-soft">
            {eyebrow}
          </div>
        )}
        <h1 className="m-0 mb-1.5 text-[28px] leading-[1.15] font-bold tracking-[-0.8px] text-fg">
          <TextoAnimado key={titulo} texto={titulo} paso={45} />
        </h1>
        <p className="anim-entrada m-0 text-[14px] text-fg-muted" style={varsCss({ '--retraso': '180ms' })}>{descripcion}</p>
      </div>
      {acciones && <div className="flex flex-wrap gap-2.5">{acciones}</div>}
    </div>
  )
}
