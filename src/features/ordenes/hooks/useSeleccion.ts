import { useCallback, useMemo, useState } from 'react'

/** Selección múltiple de filas por id. */
export function useSeleccion(idsVisibles: number[]) {
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())

  const alternar = useCallback((id: number) => {
    setSeleccion((previo) => {
      const siguiente = new Set(previo)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }, [])

  const limpiar = useCallback(() => setSeleccion(new Set()), [])

  const todasVisiblesSeleccionadas =
    idsVisibles.length > 0 && idsVisibles.every((id) => seleccion.has(id))

  const alternarTodas = useCallback(() => {
    setSeleccion((previo) => {
      const siguiente = new Set(previo)
      const todas = idsVisibles.every((id) => siguiente.has(id))
      idsVisibles.forEach((id) => (todas ? siguiente.delete(id) : siguiente.add(id)))
      return siguiente
    })
  }, [idsVisibles])

  const cantidad = useMemo(() => seleccion.size, [seleccion])

  return {
    seleccion,
    cantidad,
    alternar,
    alternarTodas,
    limpiar,
    todasVisiblesSeleccionadas,
  }
}
