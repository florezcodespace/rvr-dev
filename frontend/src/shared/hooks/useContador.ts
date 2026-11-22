import { useEffect, useState } from 'react'

const MENOS_MOVIMIENTO = '(prefers-reduced-motion: reduce)'

/** Lee la preferencia del sistema en el momento de usarla, no al montar. */
export function prefiereMenosMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(MENOS_MOVIMIENTO).matches
  )
}

/**
 * Cuenta desde 0 hasta `destino` con desaceleración cúbica.
 * Con prefers-reduced-motion la cifra aparece directamente en su valor final:
 * la animación es decorativa, el dato nunca depende de ella.
 */
export function useContador(destino: number, duracion = 1100): number {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (prefiereMenosMovimiento()) {
      const inmediato = requestAnimationFrame(() => setValor(destino))
      return () => cancelAnimationFrame(inmediato)
    }

    let cuadro = 0
    const inicio = performance.now()

    const paso = (ahora: number) => {
      const avance = Math.min((ahora - inicio) / duracion, 1)
      const suavizado = 1 - (1 - avance) ** 3
      setValor(Math.round(destino * suavizado))
      if (avance < 1) cuadro = requestAnimationFrame(paso)
    }

    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [destino, duracion])

  return valor
}
