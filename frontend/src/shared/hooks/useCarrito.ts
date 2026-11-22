import { useCallback, useEffect, useState } from 'react'
import { storage } from '@shared/lib/storage'

/**
 * Servicios seleccionados en el catálogo (CA_21_04). Sobrevive al registro y
 * al inicio de sesión: el cliente elige sin cuenta y envía después de entrar.
 */
export interface ItemCarrito {
  servicioId: number
  nombre: string
  categoria: string
  precioBase: number
  cantidad: number
}

const CLAVE = 'rvr.carrito'
const EVENTO = 'rvr:carrito'

const leer = () => storage.get<ItemCarrito[]>(CLAVE, [])

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>(leer)

  useEffect(() => {
    const sincronizar = () => setItems(leer())
    window.addEventListener(EVENTO, sincronizar)
    window.addEventListener('storage', sincronizar)
    return () => {
      window.removeEventListener(EVENTO, sincronizar)
      window.removeEventListener('storage', sincronizar)
    }
  }, [])

  const guardar = useCallback((siguiente: ItemCarrito[]) => {
    storage.set(CLAVE, siguiente)
    setItems(siguiente)
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  const agregar = useCallback(
    (item: Omit<ItemCarrito, 'cantidad'>, cantidad = 1) => {
      const actual = leer()
      const existente = actual.find((i) => i.servicioId === item.servicioId)
      guardar(
        existente
          ? actual.map((i) => (i.servicioId === item.servicioId ? { ...i, cantidad: Math.min(i.cantidad + cantidad, 50) } : i))
          : [...actual, { ...item, cantidad }],
      )
    },
    [guardar],
  )

  const cambiarCantidad = useCallback(
    (servicioId: number, cantidad: number) =>
      guardar(leer().map((i) => (i.servicioId === servicioId ? { ...i, cantidad: Math.max(1, Math.min(cantidad, 50)) } : i))),
    [guardar],
  )

  const quitar = useCallback((servicioId: number) => guardar(leer().filter((i) => i.servicioId !== servicioId)), [guardar])
  const vaciar = useCallback(() => guardar([]), [guardar])

  return {
    items,
    agregar,
    cambiarCantidad,
    quitar,
    vaciar,
    unidades: items.reduce((s, i) => s + i.cantidad, 0),
    estimado: items.reduce((s, i) => s + i.cantidad * i.precioBase, 0),
    tiene: (servicioId: number) => items.some((i) => i.servicioId === servicioId),
  }
}

export const hayCarrito = () => leer().length > 0
