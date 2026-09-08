import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ESTADOS_ORDEN, type EstadoOrden } from '@shared/domain/estadoOrden'
import { FILTROS_INICIALES, type FiltrosOrdenes } from '../types'

/**
 * Los filtros viven en la URL: el listado se puede compartir por link, el botón
 * "atrás" del navegador funciona y recargar no pierde el estado.
 */
export function useFiltrosOrdenes() {
  const [params, setParams] = useSearchParams()

  const filtros = useMemo<FiltrosOrdenes>(() => {
    const estados = (params.get('estado') ?? '')
      .split(',')
      .filter((valor): valor is EstadoOrden =>
        ESTADOS_ORDEN.includes(valor as EstadoOrden),
      )

    const numero = (clave: string) => {
      const valor = Number(params.get(clave))
      return Number.isFinite(valor) && valor > 0 ? valor : null
    }

    return {
      busqueda: params.get('q') ?? '',
      estados,
      clienteId: numero('cliente'),
      tecnicoId: numero('tecnico'),
      desde: params.get('desde'),
      hasta: params.get('hasta'),
      pagina: Math.max(Number(params.get('pagina')) || 1, 1),
    }
  }, [params])

  /** Cualquier cambio de filtro vuelve a la página 1, salvo el cambio de página. */
  const actualizar = useCallback(
    (cambios: Partial<FiltrosOrdenes>) => {
      const siguiente: FiltrosOrdenes = {
        ...filtros,
        ...cambios,
        pagina: cambios.pagina ?? 1,
      }

      const nuevos = new URLSearchParams()
      if (siguiente.busqueda) nuevos.set('q', siguiente.busqueda)
      if (siguiente.estados.length) nuevos.set('estado', siguiente.estados.join(','))
      if (siguiente.clienteId) nuevos.set('cliente', String(siguiente.clienteId))
      if (siguiente.tecnicoId) nuevos.set('tecnico', String(siguiente.tecnicoId))
      if (siguiente.desde) nuevos.set('desde', siguiente.desde)
      if (siguiente.hasta) nuevos.set('hasta', siguiente.hasta)
      if (siguiente.pagina > 1) nuevos.set('pagina', String(siguiente.pagina))

      setParams(nuevos, { replace: true })
    },
    [filtros, setParams],
  )

  const limpiar = useCallback(() => setParams(new URLSearchParams()), [setParams])

  const activos =
    (filtros.busqueda ? 1 : 0) +
    (filtros.estados.length ? 1 : 0) +
    (filtros.clienteId ? 1 : 0) +
    (filtros.tecnicoId ? 1 : 0) +
    (filtros.desde || filtros.hasta ? 1 : 0)

  return { filtros, actualizar, limpiar, activos, iniciales: FILTROS_INICIALES }
}
