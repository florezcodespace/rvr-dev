import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconAyuda } from '@shared/components/icons'
import { cn } from '@shared/lib/cn'

interface Posicion {
  texto: string
  x: number
  y: number
  arriba: boolean
}

const RETRASO_MS = 300
const MARGEN = 8

/**
 * Tooltips propios del sistema.
 *
 * Se monta una sola vez. Cualquier elemento con `title` (o `data-tooltip`)
 * muestra este globo en lugar del nativo del navegador: así los ~100 `title`
 * que ya existen quedan con el estilo del portal sin tocarlos uno por uno.
 * El texto pasa a `data-tooltip` para que el navegador no pinte el suyo.
 */
export function TooltipGlobal() {
  const [pos, setPos] = useState<Posicion | null>(null)
  const objetivo = useRef<HTMLElement | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => {
    const ocultar = () => {
      window.clearTimeout(temporizador.current)
      objetivo.current = null
      setPos(null)
    }

    const preparar = (el: HTMLElement): string | null => {
      const titulo = el.getAttribute('title')
      if (titulo) {
        el.setAttribute('data-tooltip', titulo)
        el.removeAttribute('title')
        // El title era el nombre accesible de los botones de solo icono
        if (!el.getAttribute('aria-label') && !el.textContent?.trim()) el.setAttribute('aria-label', titulo)
      }
      return el.getAttribute('data-tooltip')
    }

    const mostrar = (el: HTMLElement, inmediato: boolean) => {
      const texto = preparar(el)
      if (!texto) return
      objetivo.current = el
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(() => {
        if (objetivo.current !== el || !el.isConnected) return
        const r = el.getBoundingClientRect()
        const arriba = r.top > 64
        setPos({ texto, x: r.left + r.width / 2, y: arriba ? r.top - MARGEN : r.bottom + MARGEN, arriba })
      }, inmediato ? 0 : RETRASO_MS)
    }

    const buscar = (t: EventTarget | null) =>
      t instanceof Element ? (t.closest('[title],[data-tooltip]') as HTMLElement | null) : null

    const alEntrar = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const el = buscar(e.target)
      if (el && el !== objetivo.current) mostrar(el, false)
      else if (!el && objetivo.current) ocultar()
    }
    const alEnfocar = (e: FocusEvent) => {
      const el = buscar(e.target)
      if (el && (e.target as Element).matches(':focus-visible')) mostrar(el, true)
    }
    const alSalir = (e: PointerEvent | FocusEvent) => {
      const destino = e.relatedTarget as Node | null
      if (objetivo.current && (!destino || !objetivo.current.contains(destino))) ocultar()
    }
    const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') ocultar() }

    document.addEventListener('pointerover', alEntrar)
    document.addEventListener('pointerout', alSalir)
    document.addEventListener('focusin', alEnfocar)
    document.addEventListener('focusout', alSalir)
    document.addEventListener('pointerdown', ocultar)
    document.addEventListener('keydown', alTecla)
    window.addEventListener('scroll', ocultar, true)
    return () => {
      document.removeEventListener('pointerover', alEntrar)
      document.removeEventListener('pointerout', alSalir)
      document.removeEventListener('focusin', alEnfocar)
      document.removeEventListener('focusout', alSalir)
      document.removeEventListener('pointerdown', ocultar)
      document.removeEventListener('keydown', alTecla)
      window.removeEventListener('scroll', ocultar, true)
      window.clearTimeout(temporizador.current)
    }
  }, [])

  if (!pos) return null
  // Se mantiene dentro de la pantalla aunque el elemento esté en un borde
  const ancho = Math.min(280, window.innerWidth - 2 * MARGEN)
  const izquierda = Math.min(Math.max(pos.x - ancho / 2, MARGEN), window.innerWidth - ancho - MARGEN)

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[110] flex"
      style={{ left: izquierda, width: ancho, top: pos.y, transform: pos.arriba ? 'translateY(-100%)' : undefined, justifyContent: 'center' }}
    >
      <span
        className="rounded-[10px] bg-[var(--rvr-fg)] px-2.5 py-1.5 text-[12px] leading-[1.4] font-medium text-[var(--rvr-surface-solid)] shadow-[0_4px_14px_rgb(15_23_42/0.18)]"
        style={{ maxWidth: ancho }}
      >
        {pos.texto}
      </span>
    </div>,
    document.body,
  )
}

/** Icono «?» junto a una etiqueta, con la explicación en el tooltip del sistema. */
export function Ayuda({ texto, className }: { texto: string; className?: string }): ReactNode {
  return (
    <button
      type="button"
      data-tooltip={texto}
      aria-label={`Ayuda: ${texto}`}
      onClick={(e) => e.preventDefault()}
      className={cn('inline-grid size-[18px] cursor-help place-items-center rounded-full border-0 bg-transparent p-0 align-middle text-fg-faint hover:text-fg-muted', className)}
    >
      <IconAyuda width={14} height={14} />
    </button>
  )
}
