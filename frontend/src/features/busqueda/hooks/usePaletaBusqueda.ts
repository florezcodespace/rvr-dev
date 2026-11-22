import { useCallback, useEffect, useState } from 'react'

const esCampoDeTexto = (elemento: Element | null): boolean =>
  elemento instanceof HTMLInputElement ||
  elemento instanceof HTMLTextAreaElement ||
  elemento instanceof HTMLSelectElement ||
  (elemento as HTMLElement | null)?.isContentEditable === true

/**
 * Abre la paleta con ⌘K / Ctrl+K desde cualquier sitio, y con "/" cuando no se
 * está escribiendo en un campo.
 */
export function usePaletaBusqueda() {
  const [abierta, setAbierta] = useState(false)

  const abrir = useCallback(() => setAbierta(true), [])
  const cerrar = useCallback(() => setAbierta(false), [])

  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      const combinacion = (evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k'
      const barra = evento.key === '/' && !esCampoDeTexto(document.activeElement)

      if (combinacion || barra) {
        evento.preventDefault()
        setAbierta((previo) => (combinacion ? !previo : true))
      }
    }

    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [])

  return { abierta, abrir, cerrar }
}
