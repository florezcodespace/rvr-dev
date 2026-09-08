import { useEffect, useState } from 'react'
import { dashboardService } from '../api'
import type { ResumenDashboard } from '../types'

interface Estado {
  datos: ResumenDashboard | null
  cargando: boolean
  error: string | null
}

export function useResumenDashboard(): Estado {
  const [estado, setEstado] = useState<Estado>({
    datos: null,
    cargando: true,
    error: null,
  })

  useEffect(() => {
    let activo = true

    dashboardService
      .obtenerResumen()
      .then((datos) => {
        if (activo) setEstado({ datos, cargando: false, error: null })
      })
      .catch(() => {
        if (activo)
          setEstado({
            datos: null,
            cargando: false,
            error: 'No pudimos cargar el resumen del día.',
          })
      })

    return () => {
      activo = false
    }
  }, [])

  return estado
}
