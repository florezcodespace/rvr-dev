import { useEffect, useState } from 'react'
import { ordenesService } from '../api'
import type { BloqueAgenda, CatalogosOrden } from '../types'

export function useCatalogosOrden() {
  const [catalogos, setCatalogos] = useState<CatalogosOrden | null>(null)

  useEffect(() => {
    let activo = true
    ordenesService.catalogos().then((datos) => {
      if (activo) setCatalogos(datos)
    })
    return () => {
      activo = false
    }
  }, [])

  return catalogos
}

/** Agenda del técnico seleccionado; null mientras no haya técnico. */
export function useAgendaTecnico(tecnicoId: number | null, fecha: string) {
  const [respuesta, setRespuesta] = useState<{
    tecnicoId: number
    bloques: BloqueAgenda[]
  } | null>(null)

  useEffect(() => {
    if (tecnicoId === null) return

    let activo = true
    ordenesService.agendaTecnico(tecnicoId, fecha).then((bloques) => {
      if (activo) setRespuesta({ tecnicoId, bloques })
    })
    return () => {
      activo = false
    }
  }, [tecnicoId, fecha])

  // Se descarta la respuesta anterior durante el render en vez de limpiarla en el efecto.
  return respuesta && respuesta.tecnicoId === tecnicoId ? respuesta.bloques : null
}
