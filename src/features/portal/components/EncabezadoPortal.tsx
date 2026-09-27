import type { ReactNode } from 'react'
import { TextoAnimado } from '@shared/components/ui'

export function EncabezadoPortal({ eyebrow, titulo, descripcion, acciones }: { eyebrow: string; titulo: string; descripcion?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-primary-on-soft uppercase">{eyebrow}</div>
        <h1 className="m-0 text-[25px] leading-tight font-bold tracking-[-0.7px] text-fg"><TextoAnimado key={titulo} texto={titulo} paso={40} /></h1>
        {descripcion && <p className="m-0 mt-1.5 max-w-[680px] text-[13.5px] text-fg-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2.5">{acciones}</div>}
    </div>
  )
}
