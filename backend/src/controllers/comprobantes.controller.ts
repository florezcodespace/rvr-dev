import type { Request, Response } from 'express'
import * as comprobantes from '../models/comprobantes.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await comprobantes.listar(comprobantes.filtroComprobantes.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await comprobantes.detalle(idRuta.parse(req.params.id)))
}

export async function aprobar(req: Request, res: Response) {
  res.json(await comprobantes.aprobar(idRuta.parse(req.params.id), req.sesion!.usuarioId))
}

export async function rechazar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { motivo } = comprobantes.datosRechazo.parse(req.body)
  res.json(await comprobantes.rechazar(id, motivo, req.sesion!.usuarioId))
}
