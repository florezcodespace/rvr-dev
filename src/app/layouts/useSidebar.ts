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
