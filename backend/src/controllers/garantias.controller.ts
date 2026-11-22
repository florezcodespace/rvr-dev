import type { Request, Response } from 'express'
import * as garantias from '../models/garantias.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await garantias.listar(garantias.filtroGarantias.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await garantias.detalle(idRuta.parse(req.params.id)))
}

export async function aprobarReclamo(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { respuesta } = garantias.datosAprobar.parse(req.body)
  res.json(await garantias.aprobarReclamo(id, respuesta, req.sesion!.usuarioId))
}

export async function rechazarReclamo(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { respuesta } = garantias.datosRechazo.parse(req.body)
  res.json(await garantias.rechazarReclamo(id, respuesta, req.sesion!.usuarioId))
}
