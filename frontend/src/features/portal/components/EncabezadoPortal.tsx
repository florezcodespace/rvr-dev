import type { ReactNode } from 'react'
import { TextoAnimado } from '@shared/components/ui'
import { varsCss } from '@shared/lib/varsCss'

/** Encabezado de las vistas del portal del cliente: título que entra palabra a palabra. */
export function EncabezadoPortal({ eyebrow, titulo, descripcion, acciones }: { eyebrow?: string; titulo: string; descripcion?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="vidrio anim-entrada mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--rvr-glass-borde)] px-3 py-1 text-[12.5px] font-semibold text-primary-on-soft">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            {eyebrow}
          </span>
        )}
        <h1 className="m-0 text-[30px] leading-[1.1] font-extrabold tracking-[-1px] text-fg sm:text-[36px]">
          <TextoAnimado key={titulo} texto={titulo} paso={40} />
        </h1>
        {descripcion && (
          <p className="anim-entrada m-0 mt-2 max-w-[680px] text-[15px] leading-[1.6] text-fg-muted" style={varsCss({ '--retraso': '180ms' })}>
            {descripcion}
          </p>
        )}
      </div>
      {acciones && <div className="anim-entrada flex flex-wrap gap-2.5" style={varsCss({ '--retraso': '240ms' })}>{acciones}</div>}
    </div>
  )
}
