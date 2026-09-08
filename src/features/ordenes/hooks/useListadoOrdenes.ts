import { useEffect, useState } from 'react'
import { ordenesService } from '../api'
import type { FiltrosOrdenes, ListadoOrdenes } from '../types'

interface Resultado {
  /** Filtros con los que se resolvió esta respuesta. */
  filtros: FiltrosOrdenes
  datos: ListadoOrdenes | null
  error: string | null
}

/**
 * Carga el listado y deriva `cargando` comparando los filtros pedidos con los de
 * la última respuesta, en vez de encender una bandera dentro del efecto.
 */
export function useListadoOrdenes(filtros: FiltrosOrdenes) {
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    let activo = true

    ordenesService
      .listar(filtros)
      .then((datos) => {
        if (activo) setResultado({ filtros, datos, error: null })
      })
      .catch(() => {
        if (activo)
          setResultado({
            filtros,
            datos: null,
            error: 'No pudimos cargar las órdenes de servicio.',
          })
      })

    return () => {
      activo = false
    }
    // `filtros` se memoiza a partir de los search params: cambia solo si la URL cambia.
  }, [filtros])

  return {
    // Mientras llega la nueva página se mantienen los datos previos (sin parpadeo).
    datos: resultado?.datos ?? null,
    error: resultado?.error ?? null,
    cargando: resultado === null || resultado.filtros !== filtros,
  }
}
