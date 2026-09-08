import { useEffect, useState } from 'react'

interface Respuesta<T, P> {
  params: P
  datos: T | null
  error: string | null
}

/**
 * Carga un recurso cuando cambian sus parámetros.
 *
 * `cargando` se deriva comparando los parámetros pedidos con los de la última
 * respuesta —en vez de encender una bandera dentro del efecto— y los datos
 * previos se mantienen mientras llega la respuesta nueva, así las listas no
 * parpadean al cambiar de página o de filtro.
 */
export function useRecurso<T, P>(
  cargar: (params: P) => Promise<T>,
  params: P,
  mensajeError = 'No pudimos cargar la información.',
) {
  const [respuesta, setRespuesta] = useState<Respuesta<T, P> | null>(null)

  useEffect(() => {
    let activo = true

    cargar(params)
      .then((datos) => {
        if (activo) setRespuesta({ params, datos, error: null })
      })
      .catch(() => {
        if (activo) setRespuesta({ params, datos: null, error: mensajeError })
      })

    return () => {
      activo = false
    }
    // `cargar` es estable (viene del módulo de servicio); `params` se memoiza en el hook de URL.
  }, [cargar, params, mensajeError])

  return {
    datos: respuesta?.datos ?? null,
    error: respuesta?.error ?? null,
    cargando: respuesta === null || respuesta.params !== params,
  }
}
