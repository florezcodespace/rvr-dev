import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filtros de un listado guardados en la URL (RNF-006: filtros en todas las
 * tablas). Compartir el enlace, el botón atrás y recargar conservan el filtro.
 *
 * `claves` son los nombres de los filtros además de `q` y `pagina`. Cualquier
 * cambio de filtro vuelve a la página 1.
 */
export function useFiltros<K extends string>(claves: readonly K[], porDefecto: Partial<Record<K, string>> = {}) {
  const [params, setParams] = useSearchParams()

  const valores = useMemo(() => {
    const salida = {
      q: params.get('q') ?? '',
      pagina: Math.max(Number(params.get('pagina')) || 1, 1),
    } as { q: string; pagina: number } & Record<K, string>
    for (const clave of claves) {
      ;(salida as Record<string, string | number>)[clave] = params.get(clave) ?? porDefecto[clave] ?? ''
    }
    return salida
    // `claves` y `porDefecto` son constantes del módulo que llama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const actualizar = useCallback(
    (cambios: Partial<Record<K | 'q', string>> & { pagina?: number }) => {
      const siguiente = new URLSearchParams(params)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (clave === 'pagina') continue
        const texto = valor === undefined || valor === null ? '' : String(valor)
        if (texto === '' || texto === (porDefecto as Record<string, string>)[clave]) siguiente.delete(clave)
        else siguiente.set(clave, texto)
      }
      const pagina = cambios.pagina ?? 1
      if (pagina > 1) siguiente.set('pagina', String(pagina))
      else siguiente.delete('pagina')
      setParams(siguiente, { replace: true })
    },
    [params, setParams, porDefecto],
  )

  return {
    valores,
    /** Objeto estable para `useRecurso`. */
    params: valores,
    set: (clave: K | 'q', valor: string) => actualizar({ [clave]: valor } as Partial<Record<K | 'q', string>>),
    setPagina: (pagina: number) => actualizar({ pagina } as Partial<Record<K | 'q', string>> & { pagina: number }),
    actualizar,
    limpiar: () => setParams(new URLSearchParams(), { replace: true }),
    hayFiltros: [...params.keys()].some((k) => k !== 'pagina'),
  }
}
