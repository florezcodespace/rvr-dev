import { Dropdown } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import type { ReactNode } from 'react'

export interface OpcionSelector {
  id: number
  etiqueta: string
  /** Iniciales del avatar cuadrado (clientes y técnicos). */
  avatar?: string
  /** Texto secundario dentro de la fila. */
  secundario?: string
  /** Contenido a la derecha (badge de disponibilidad, valor…). */
  trailing?: ReactNode
}

interface Props {
  id: string
  describedBy?: string
  opciones: OpcionSelector[]
  valor: number | null
  placeholder: string
  /** Permite volver a "sin selección" (técnico y cotización son opcionales). */
  limpiable?: boolean
  invalido?: boolean
  onChange: (id: number | null) => void
}

function Fila({ opcion }: { opcion: OpcionSelector }) {
  return (
    <>
      {opcion.avatar && (
        <span className="flex size-[22px] flex-none items-center justify-center rounded-[6px] bg-primary-soft text-[9.5px] font-bold text-primary-on-soft">
          {opcion.avatar}
        </span>
      )}
      <span className="truncate text-[13px] font-medium text-fg">{opcion.etiqueta}</span>
      {opcion.secundario && (
        <span className="truncate text-[12.5px] text-fg-muted">{opcion.secundario}</span>
      )}
      {opcion.trailing && <span className="ml-auto flex-none">{opcion.trailing}</span>}
    </>
  )
}

/** Selector con avatar y contenido a la derecha, como los campos de la Vista 4. */
export function Selector({
  id,
  describedBy,
  opciones,
  valor,
  placeholder,
  limpiable = false,
  invalido = false,
  onChange,
}: Props) {
  const elegida = opciones.find((o) => o.id === valor)

  return (
    <Dropdown
      className="w-full"
      panelClassName="w-full"
      etiquetaComoCaja
      invalido={invalido}
      id={id}
      describedBy={describedBy}
      etiqueta={
        elegida ? (
          <Fila opcion={elegida} />
        ) : (
          <span className="text-[13px] text-fg-faint">{placeholder}</span>
        )
      }
    >
      {(cerrar) => (
        <ul className="flex max-h-72 list-none flex-col overflow-y-auto p-0">
          {limpiable && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  cerrar()
                }}
                className="w-full cursor-pointer rounded-[7px] px-2 py-2 text-left text-[12.5px] text-fg-muted italic hover:bg-surface-muted"
              >
                Sin asignar
              </button>
            </li>
          )}
          {opciones.map((opcion) => (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(opcion.id)
                  cerrar()
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-[7px] px-2 py-2 text-left hover:bg-surface-muted',
                  opcion.id === valor && 'bg-primary-soft',
                )}
              >
                <Fila opcion={opcion} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dropdown>
  )
}
