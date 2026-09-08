import { useEffect, useState } from 'react'
import { storage } from '@shared/lib/storage'

const CLAVE = 'rvr.borrador-orden'

interface Borrador<T> {
  valores: T
  guardadoEn: string
}

/**
 * Borrador local del formulario: si el usuario se sale o recarga, la orden a
 * medio llenar no se pierde. Se borra al crear la orden.
 */
export function useBorradorOrden<T>(valores: T, activo: boolean) {
  const [guardadoEn, setGuardadoEn] = useState<string | null>(
    () => storage.get<Borrador<T> | null>(CLAVE, null)?.guardadoEn ?? null,
  )

  useEffect(() => {
    if (!activo) return

    const id = setTimeout(() => {
      const marca = new Date().toISOString()
      storage.set<Borrador<T>>(CLAVE, { valores, guardadoEn: marca })
      setGuardadoEn(marca)
    }, 800)

    return () => clearTimeout(id)
  }, [valores, activo])

  return {
    guardadoEn,
    leer: () => storage.get<Borrador<T> | null>(CLAVE, null)?.valores ?? null,
    limpiar: () => {
      storage.remove(CLAVE)
      setGuardadoEn(null)
    },
  }
}
