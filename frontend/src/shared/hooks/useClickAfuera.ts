import { useEffect, type RefObject } from 'react'

/** Cierra popovers y menús al hacer clic fuera o presionar Escape. */
export function useClickAfuera(
  ref: RefObject<HTMLElement | null>,
  alCerrar: () => void,
  activo = true,
) {
  useEffect(() => {
    if (!activo) return

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) alCerrar()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') alCerrar()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, alCerrar, activo])
}
