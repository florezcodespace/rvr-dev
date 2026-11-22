import type { Request, Response } from 'express'
import * as permisos from '../models/permisos.model.js'
import { idRuta } from '../utils/comun.js'
import { MODULOS } from '../utils/modulos.js'

/** CA_66_03 · Módulos definidos en el sistema. */
export async function modulos(_req: Request, res: Response) {
  res.json(MODULOS)
}

export async function catalogo(_req: Request, res: Response) {
  res.json(await permisos.catalogo())
}

export async function listar(req: Request, res: Response) {
  res.json(await permisos.listar(permisos.filtroPermisos.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await permisos.detalle(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await permisos.registrar(permisos.datosPermiso.parse(req.body)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await permisos.editar(id, permisos.datosPermiso.parse(req.body)))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { estado } = permisos.datosEstado.parse(req.body)
  res.json(await permisos.cambiarEstado(id, estado))
}
