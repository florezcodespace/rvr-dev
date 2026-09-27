import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@shared/lib/cn'

export interface AccionFila {
  clave: string
  /** Texto del tooltip y nombre accesible del botón. */
  etiqueta: string
  icono: ReactNode
  /** A dónde lleva (para "Ver"); si no, se pasa `onClick`. */
  a?: string
  onClick?: () => void
  /** Pinta el control en rojo: borrar y demás acciones que no se deshacen. */
  peligro?: boolean
  /** Deshabilitado con el motivo en el tooltip. */
  motivo?: string
}

const BOTON =
  'flex size-[30px] flex-none items-center justify-center rounded-[8px] border border-transparent text-fg-subtle transition-colors hover:border-border-base hover:bg-surface-muted hover:text-fg focus-visible:border-border-base'

/**
 * Acciones de una fila como iconos: ver, editar, borrar.
 *
 * Un menú escondía cada acción detrás de dos clics; aquí son uno. Cada icono
 * lleva su nombre accesible y su tooltip, porque un icono solo no dice qué hace
 * y un lector de pantalla no puede leer un dibujo.
 */
export function AccionesFila({
  acciones,
  className,
}: {
  acciones: AccionFila[]
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-end gap-0.5', className)}>
      {acciones.map((accion) =>
        accion.a ? (
          <Link
            key={accion.clave}
            to={accion.a}
            title={accion.etiqueta}
            aria-label={accion.etiqueta}
            className={BOTON}
          >
            {accion.icono}
          </Link>
        ) : (
          <button
            key={accion.clave}
            type="button"
            title={accion.motivo ?? accion.etiqueta}
            aria-label={accion.etiqueta}
            disabled={accion.motivo !== undefined}
            onClick={(evento) => {
              evento.stopPropagation()
              accion.onClick?.()
            }}
            className={cn(
              BOTON,
              'cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
              accion.peligro && 'hover:bg-danger-soft hover:text-danger-fg',
            )}
          >
            {accion.icono}
          </button>
        ),
      )}
    </div>
  )
}
