import type { CategoriaServicio } from '@shared/domain/estados'
import { pedir } from './api'

export interface ServicioCatalogo {
  id: number
  nombre: string
  descripcion: string
  precioBase: number
  categoria: CategoriaServicio
  duracionMin: number
  diasGarantia: number
}

export function cargarCatalogo(params: { q?: string; categoria?: string } = {}) {
  return pedir<{ categorias: CategoriaServicio[]; items: ServicioCatalogo[] }>('/publico/servicios', { params, sinSesion: true })
}
