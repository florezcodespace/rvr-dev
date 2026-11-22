import { useEffect, useRef, useState } from 'react'

/**
 * Marca un elemento como visible la primera vez que entra en pantalla.
 *
 * Se usa para las entradas al desplazar de la landing. Se desconecta tras el
 * primer cruce: una animación que se repite cada vez que el usuario sube y baja
 * cansa, y además obliga a mantener el observador vivo sin necesidad.
 */
export function useRevelar<T extends HTMLElement = HTMLDivElement>(margen = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  // Sin IntersectionObserver el contenido arranca visible: nunca se queda
  // invisible por falta de soporte, y se decide en el primer render en vez de
  // encender la bandera dentro del efecto.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver !== 'function')

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return

    if (typeof IntersectionObserver !== 'function') return

    const observador = new IntersectionObserver(
      (entradas) => {
        // También se revela si el bloque ya quedó por encima de la ventana: al
        // saltar al pie de un tirón el elemento pasa de abajo a arriba en un
        // solo cuadro y nunca llega a intersecar, y se quedaría invisible.
        const entro = entradas.some(
          (e) => e.isIntersecting || e.boundingClientRect.bottom < 0,
        )
        if (entro) {
          setVisible(true)
          observador.disconnect()
        }
      },
      { rootMargin: margen, threshold: 0.08 },
    )

    observador.observe(nodo)
    return () => observador.disconnect()
  }, [margen])

  return { ref, visible }
}
