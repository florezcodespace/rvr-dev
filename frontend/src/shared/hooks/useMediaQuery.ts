import { useEffect, useState } from 'react'

const evaluar = (consulta: string): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(consulta).matches

/** Suscribe un componente a una media query, con limpieza del listener. */
export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() => evaluar(consulta))

  // Si cambia la consulta, el valor se recalcula en el propio render: meterlo en
  // un efecto provocaría un render extra con el resultado de la consulta vieja.
  const [consultaPrevia, setConsultaPrevia] = useState(consulta)
  if (consulta !== consultaPrevia) {
    setConsultaPrevia(consulta)
    setCoincide(evaluar(consulta))
  }

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const lista = window.matchMedia(consulta)
    const alCambiar = (evento: MediaQueryListEvent) => setCoincide(evento.matches)
    lista.addEventListener('change', alCambiar)
    return () => lista.removeEventListener('change', alCambiar)
  }, [consulta])

  return coincide
}
