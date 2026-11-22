import type { Request, Response } from 'express'
import * as roles from '../models/roles.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await roles.listar(roles.filtroRoles.parse(req.query)))
}

export async function opciones(_req: Request, res: Response) {
  res.json(await roles.opciones())
}

export async function detalle(req: Request, res: Response) {
  res.json(await roles.detalle(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await roles.registrar(roles.datosRol.parse(req.body)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await roles.editar(id, roles.datosRol.parse(req.body), req.sesion!.rolId))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { estado } = roles.datosEstado.parse(req.body)
  res.json(await roles.cambiarEstado(id, estado))
}

export async function eliminar(req: Request, res: Response) {
  await roles.eliminar(idRuta.parse(req.params.id), req.sesion!.rolId)
  res.status(204).end()
}
