import { useCallback, useState } from 'react'
import type { EstadoMeta } from '@shared/domain/tipos'
import { useToast } from './useToast'

/**
 * Cambio de estado optimista para los listados.
 *
 * Pinta el estado nuevo de inmediato, lo guarda en segundo plano y ofrece
 * "Deshacer" en el aviso. Si el guardado falla, revierte y lo dice.
 */
export function useCambioEstado<E extends string>(
  guardar: (id: number, estado: E) => Promise<void>,
  meta: Record<E, EstadoMeta>,
) {
  const { mostrar } = useToast()
  const [locales, setLocales] = useState<Record<number, E>>({})

  const revertir = useCallback(
    async (id: number, anterior: E, registro: string) => {
      setLocales((previos) => ({ ...previos, [id]: anterior }))
      try {
        await guardar(id, anterior)
      } catch {
        mostrar({ tono: 'error', mensaje: `No pudimos deshacer el cambio de ${registro}` })
      }
    },
    [guardar, mostrar],
  )

  const aplicar = useCallback(
    async (id: number, destino: E, anterior: E, registro: string) => {
      setLocales((previos) => ({ ...previos, [id]: destino }))
      try {
        await guardar(id, destino)
        mostrar({
          tono: 'exito',
          mensaje: `${registro} → ${meta[destino].label}`,
          deshacer: () => void revertir(id, anterior, registro),
        })
      } catch {
        setLocales((previos) => ({ ...previos, [id]: anterior }))
        mostrar({ tono: 'error', mensaje: `No pudimos cambiar el estado de ${registro}` })
      }
    },
    [guardar, meta, mostrar, revertir],
  )

  return {
    /** Estado a pintar: el cambio local si existe, si no el del servidor. */
    estadoDe: (id: number, base: E): E => locales[id] ?? base,
    cambiar: (id: number, destino: E, anterior: E, registro: string) =>
      void aplicar(id, destino, anterior, registro),
  }
}
