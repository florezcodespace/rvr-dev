import { useCallback, useState } from 'react'
import { useMediaQuery } from '@shared/hooks/useMediaQuery'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'

/**
 * Estado del sidebar. Por debajo de 1280 px se colapsa siempre —el panel
 * completo se comía un tercio del ancho útil—; a partir de ahí manda la
 * preferencia del usuario, que se recuerda entre sesiones.
 */
export function useSidebar() {
  const anchoSuficiente = useMediaQuery('(min-width: 1280px)')
  const [preferencia, setPreferencia] = useState(() =>
    storage.get<boolean>(STORAGE_KEYS.sidebarColapsado, false),
  )

  const alternar = useCallback(() => {
    setPreferencia((previo) => {
      const siguiente = !previo
      storage.set(STORAGE_KEYS.sidebarColapsado, siguiente)
      return siguiente
    })
  }, [])

  return {
    colapsado: anchoSuficiente ? preferencia : true,
    /** Solo se puede alternar donde cabe el panel completo. */
    puedeAlternar: anchoSuficiente,
    alternar,
  }
}

/**
 * Secciones del menú lateral que se pliegan y despliegan. Varias pueden estar
 * abiertas a la vez; lo que el usuario cierra se recuerda entre sesiones (la
 * primera vez, todas abiertas). La sección de la página actual se abre sola
 * al llegar a ella, para que el módulo activo nunca quede escondido.
 */
export function useSeccionesMenu(seccionActual: string | null) {
  const [plegadas, setPlegadas] = useState<Set<string>>(
    () => new Set(storage.get<string[]>(STORAGE_KEYS.seccionesPlegadas, [])),
  )

  const guardar = (siguiente: Set<string>) => {
    storage.set(STORAGE_KEYS.seccionesPlegadas, [...siguiente])
    return siguiente
  }

  // Al llegar a otra sección (y al entrar), si estaba plegada se abre.
  const [vista, setVista] = useState<string | null>(null)
  if (vista !== seccionActual) {
    setVista(seccionActual)
    if (seccionActual && plegadas.has(seccionActual)) {
      const siguiente = new Set(plegadas)
      siguiente.delete(seccionActual)
      setPlegadas(guardar(siguiente))
    }
  }

  const alternar = useCallback((titulo: string) => {
    setPlegadas((previo) => {
      const siguiente = new Set(previo)
      if (siguiente.has(titulo)) siguiente.delete(titulo)
      else siguiente.add(titulo)
      return guardar(siguiente)
    })
  }, [])

  return { estaAbierta: (titulo: string) => !plegadas.has(titulo), alternar, plegadas }
}
