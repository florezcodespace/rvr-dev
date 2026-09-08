import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface ParamsLista<Tab extends string> {
  tab: Tab
  q: string
  pagina: number
}

/**
 * Estado de listado (pestaña + búsqueda + página) guardado en la URL.
 * Compartir el link, el botón atrás y recargar funcionan sin trabajo extra.
 */
export function useListaParams<Tab extends string>(
  tabPorDefecto: Tab,
  tabsValidas: readonly Tab[],
) {
  const [params, setParams] = useSearchParams()

  const valores = useMemo<ParamsLista<Tab>>(() => {
    const tab = params.get('t') as Tab | null
    return {
      tab: tab && tabsValidas.includes(tab) ? tab : tabPorDefecto,
      q: params.get('q') ?? '',
      pagina: Math.max(Number(params.get('pagina')) || 1, 1),
    }
  }, [params, tabPorDefecto, tabsValidas])

  const actualizar = useCallback(
    (cambios: Partial<ParamsLista<Tab>>) => {
      const siguiente = { ...valores, ...cambios, pagina: cambios.pagina ?? 1 }
      const nuevos = new URLSearchParams()
      if (siguiente.tab !== tabPorDefecto) nuevos.set('t', siguiente.tab)
      if (siguiente.q) nuevos.set('q', siguiente.q)
      if (siguiente.pagina > 1) nuevos.set('pagina', String(siguiente.pagina))
      setParams(nuevos, { replace: true })
    },
    [valores, setParams, tabPorDefecto],
  )

  return {
    ...valores,
    /** Objeto estable para pasarlo como dependencia a useRecurso. */
    params: valores,
    setTab: (tab: Tab) => actualizar({ tab }),
    setQ: (q: string) => actualizar({ q }),
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiar: () => setParams(new URLSearchParams()),
  }
}
