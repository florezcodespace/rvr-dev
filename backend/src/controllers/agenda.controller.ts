import type { Request, Response } from 'express'
import * as agenda from '../models/agenda.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await agenda.listar(agenda.filtroVisitas.parse(req.query)))
}

export async function ordenes(_req: Request, res: Response) {
  res.json(await agenda.ordenesAgendables())
}

export async function agendar(req: Request, res: Response) {
  res.status(201).json(await agenda.agendar(agenda.datosAgendar.parse(req.body), req.sesion!.usuarioId))
}

export async function reprogramar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await agenda.reprogramar(id, agenda.datosReprogramar.parse(req.body), req.sesion!.usuarioId))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await agenda.cambiarEstado(id, agenda.datosEstado.parse(req.body), req.sesion!.usuarioId))
}
