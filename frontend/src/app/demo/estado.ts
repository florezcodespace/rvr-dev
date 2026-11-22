import { useEffect, useState } from 'react'
import { MODO_DEMO } from '@shared/lib/api'

export type EstadoDemo = 'apagado' | 'preparando' | 'lista' | 'error'

let promesa: Promise<unknown> | null = null
let actual: EstadoDemo = MODO_DEMO ? 'preparando' : 'apagado'
const oyentes = new Set<(e: EstadoDemo) => void>()

/**
 * Arranca la base de demostración (PGlite + la API en el navegador). Se llama
 * al abrir el portal para que, cuando el instructor escriba su usuario, la base
 * ya esté lista.
 */
export function precalentarDemo() {
  if (!MODO_DEMO || promesa) return
  promesa = import('virtual:rvr-demo')
    .then((m) => m.prepararDemo())
    .then(
      () => cambiar('lista'),
      (error: unknown) => {
        console.error('[demo]', error)
        cambiar('error')
      },
    )
}

function cambiar(estado: EstadoDemo) {
  actual = estado
  oyentes.forEach((o) => o(estado))
}

export function useEstadoDemo(): EstadoDemo {
  const [estado, setEstado] = useState(actual)
  useEffect(() => {
    oyentes.add(setEstado)
    precalentarDemo()
    return () => {
      oyentes.delete(setEstado)
    }
  }, [])
  return estado
}

export async function reiniciarDatosDemo() {
  const m = await import('virtual:rvr-demo')
  m.reiniciarDemo()
}
