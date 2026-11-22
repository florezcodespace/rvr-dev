import { useEffect, useState } from 'react'
import { useAuth } from '@features/auth'
import { menuDe } from '@app/layouts/navigation'
import { api } from '@shared/lib/api'
import type { GrupoResultados, ResultadoBusqueda } from '../tipos'

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const PLURAL: Record<string, string> = {
  Orden: 'Órdenes', Cotización: 'Cotizaciones', Cliente: 'Clientes', Técnico: 'Técnicos', Servicio: 'Servicios', Usuario: 'Usuarios',
}

/**
 * Búsqueda global con retardo: consulta la API (que solo devuelve lo que el
 * rol puede ver) y agrega los módulos del menú que coinciden con el término.
 */
export function useBusqueda(termino: string) {
  const { usuario } = useAuth()
  const [respuesta, setRespuesta] = useState<{ termino: string; grupos: GrupoResultados[] }>({ termino: '', grupos: [] })
  const limpio = termino.trim()

  useEffect(() => {
    if (limpio.length < 2) {
      const id = setTimeout(() => setRespuesta({ termino: limpio, grupos: [] }), 0)
      return () => clearTimeout(id)
    }
    let vigente = true
    const id = setTimeout(() => {
      const vistas: ResultadoBusqueda[] = menuDe(usuario)
        .flatMap((g) => g.items.map((i) => ({ ...i, grupo: g.titulo })))
        .filter((i) => normalizar(`${i.label} ${i.grupo}`).includes(normalizar(limpio)))
        .map((i) => ({ clave: `vista-${i.to}`, tipo: 'Ir a', titulo: i.label, subtitulo: i.grupo, ruta: i.to }))

      api
        .get<{ tipo: string; id: number; titulo: string; detalle: string; enlace: string }[]>('/busqueda', { q: limpio })
        .catch(() => [])
        .then((filas) => {
          if (!vigente) return
          const grupos: GrupoResultados[] = []
          if (vistas.length) grupos.push({ tipo: 'Ir a', label: 'Ir a', items: vistas })
          for (const fila of filas) {
            let grupo = grupos.find((g) => g.tipo === fila.tipo)
            if (!grupo) {
              grupo = { tipo: fila.tipo, label: PLURAL[fila.tipo] ?? fila.tipo, items: [] }
              grupos.push(grupo)
            }
            grupo.items.push({ clave: `${fila.tipo}-${fila.id}`, tipo: fila.tipo, titulo: fila.titulo, subtitulo: fila.detalle, ruta: fila.enlace })
          }
          setRespuesta({ termino: limpio, grupos })
        })
    }, 200)
    return () => {
      vigente = false
      clearTimeout(id)
    }
  }, [limpio, usuario])

  return {
    grupos: respuesta.termino === limpio ? respuesta.grupos : [],
    cargando: limpio.length >= 2 && respuesta.termino !== limpio,
  }
}
