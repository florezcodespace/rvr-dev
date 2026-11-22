import type { Request, Response } from 'express'
import * as servicios from '../models/servicios.model.js'
import { idRuta } from '../utils/comun.js'

export async function categorias(_req: Request, res: Response) {
  res.json(servicios.CATEGORIAS)
}

export async function listar(req: Request, res: Response) {
  res.json(await servicios.listar(servicios.filtroServicios.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await servicios.detalle(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await servicios.registrar(servicios.datosServicio.parse(req.body)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await servicios.editar(id, servicios.datosServicio.parse(req.body)))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { estado } = servicios.datosEstado.parse(req.body)
  res.json(await servicios.cambiarEstado(id, estado))
}

/** HU_21 · Catálogo público, sin sesión. */
export async function catalogoPublico(req: Request, res: Response) {
  res.json(await servicios.catalogoPublico(servicios.filtroPublico.parse(req.query)))
}
