import { useCallback, useEffect, useState } from 'react'
import { api } from '@shared/lib/api'

export interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  enlace: string | null
  leida: boolean
  fecha: string
}

interface Respuesta {
  noLeidas: number
  items: Notificacion[]
}

/**
 * Avisos de la cuenta. Se consultan al abrir y cada 30 segundos, así lo que
 * hace el técnico desde el móvil o el cliente desde su portal aparece solo
 * (Móvil CA_09_04, CA_78_04, CA_80_03).
 */
export function useNotificaciones() {
  const [datos, setDatos] = useState<Respuesta | null>(null)

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.get<Respuesta>('/notificaciones'))
    } catch {
      /* sin red: se reintenta en el siguiente ciclo */
    }
  }, [])

  useEffect(() => {
    api.get<Respuesta>('/notificaciones').then(setDatos, () => undefined)
    const temporizador = window.setInterval(() => {
      if (document.visibilityState === 'visible') void cargar()
    }, 30_000)
    const alVolver = () => document.visibilityState === 'visible' && void cargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(temporizador)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [cargar])

  const marcarLeida = useCallback(async (id: number) => {
    setDatos((d) => d && { noLeidas: Math.max(d.noLeidas - (d.items.find((i) => i.id === id && !i.leida) ? 1 : 0), 0), items: d.items.map((i) => (i.id === id ? { ...i, leida: true } : i)) })
    await api.patch(`/notificaciones/${id}/leida`, {}).catch(() => undefined)
  }, [])

  const marcarTodas = useCallback(async () => {
    setDatos((d) => d && { noLeidas: 0, items: d.items.map((i) => ({ ...i, leida: true })) })
    await api.post('/notificaciones/leer-todas').catch(() => undefined)
  }, [])

  return {
    items: datos?.items ?? [],
    sinLeer: datos?.noLeidas ?? 0,
    cargando: datos === null,
    marcarLeida,
    marcarTodas,
    recargar: cargar,
  }
}
