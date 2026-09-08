import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@shared/lib/cn'

export interface ItemMenu {
  clave: string
  contenido: ReactNode
  onSelect: () => void
}

interface PropsDisparador {
  ref: React.Ref<HTMLButtonElement>
  onClick: (evento: React.MouseEvent) => void
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  type: 'button'
}

/**
 * Menú que se abre sobre su disparador y se pinta en un portal, para que no lo
 * recorte el `overflow` de la tabla. Teclado: flechas para recorrer, Enter para
 * elegir, Escape para cerrar.
 */
export function MenuFlotante({
  titulo,
  items,
  etiquetaAccesible,
  disparador,
  ancho = 224,
}: {
  titulo: string
  items: ItemMenu[]
  etiquetaAccesible: string
  disparador: (props: PropsDisparador) => ReactNode
  ancho?: number
}) {
  const [abierto, setAbierto] = useState(false)
  const [resaltado, setResaltado] = useState(0)
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const cerrar = useCallback(() => setAbierto(false), [])

  useLayoutEffect(() => {
    if (!abierto || !botonRef.current) return
    const caja = botonRef.current.getBoundingClientRect()
    const alto = 40 + items.length * 36
    const haciaArriba = caja.bottom + alto > window.innerHeight && caja.top > alto
    setPosicion({
      top: haciaArriba ? caja.top - alto - 6 : caja.bottom + 6,
      left: Math.max(8, Math.min(caja.left, window.innerWidth - ancho - 8)),
    })
  }, [abierto, items.length, ancho])

  useEffect(() => {
    if (!abierto) return

    const afuera = (evento: PointerEvent) => {
      const destino = evento.target as Node
      if (!panelRef.current?.contains(destino) && !botonRef.current?.contains(destino)) {
        cerrar()
      }
    }
    const teclado = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        cerrar()
        botonRef.current?.focus()
      } else if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        setResaltado((i) => (i + 1) % items.length)
      } else if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        setResaltado((i) => (i - 1 + items.length) % items.length)
      } else if (evento.key === 'Enter') {
        evento.preventDefault()
        items[resaltado]?.onSelect()
        cerrar()
      }
    }
    const alDesplazar = () => cerrar()

    document.addEventListener('pointerdown', afuera)
    document.addEventListener('keydown', teclado)
    window.addEventListener('scroll', alDesplazar, true)

    return () => {
      document.removeEventListener('pointerdown', afuera)
      document.removeEventListener('keydown', teclado)
      window.removeEventListener('scroll', alDesplazar, true)
    }
  }, [abierto, items, resaltado, cerrar])

  return (
    <>
      {disparador({
        ref: botonRef,
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': abierto,
        onClick: (evento) => {
          evento.stopPropagation()
          setResaltado(0)
          setAbierto((v) => !v)
        },
      })}

      {abierto &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={etiquetaAccesible}
            style={{ top: posicion.top, left: posicion.left, width: ancho }}
            className="fixed z-50 rounded-[10px] border border-border-base bg-surface p-1.5 shadow-lg"
          >
            <p className="m-0 px-2 pt-1 pb-1.5 text-[10.5px] font-bold tracking-[0.08em] text-fg-faint uppercase">
              {titulo}
            </p>
            {items.map((item, indice) => (
              <button
                key={item.clave}
                type="button"
                role="menuitem"
                onMouseEnter={() => setResaltado(indice)}
                onClick={(evento) => {
                  evento.stopPropagation()
                  item.onSelect()
                  cerrar()
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12.5px] text-fg',
                  indice === resaltado && 'bg-surface-muted',
                )}
              >
                {item.contenido}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
