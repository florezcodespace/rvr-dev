import type { ReactNode } from 'react'

/** Encabezado común de las vistas: título, resumen y acciones. */
export function PageHeader({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string
  descripcion: ReactNode
  acciones?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 mb-[5px] text-[23px] font-bold tracking-[-0.6px] text-fg">
          {titulo}
        </h1>
        <p className="m-0 text-[13px] text-fg-muted">{descripcion}</p>
      </div>
      {acciones && <div className="flex flex-wrap gap-2.5">{acciones}</div>}
    </div>
  )
}
