import type { Request, Response } from 'express'
import * as disponibilidad from '../models/disponibilidad.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await disponibilidad.listar(disponibilidad.filtroFranjas.parse(req.query)))
}

export async function libres(req: Request, res: Response) {
  res.json(await disponibilidad.libres(disponibilidad.filtroLibres.parse(req.query)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await disponibilidad.registrar(disponibilidad.datosFranja.parse(req.body)))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await disponibilidad.cambiarEstado(id, disponibilidad.datosEstado.parse(req.body)))
}
