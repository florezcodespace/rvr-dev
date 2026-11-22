import type { Request, Response } from 'express'
import * as tecnicos from '../models/tecnicos.model.js'
import { idRuta } from '../utils/comun.js'

export async function especialidades(_req: Request, res: Response) {
  res.json(await tecnicos.especialidades())
}

export async function opciones(_req: Request, res: Response) {
  res.json(await tecnicos.opciones())
}

export async function listar(req: Request, res: Response) {
  res.json(await tecnicos.listar(tecnicos.filtroTecnicos.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await tecnicos.detalle(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await tecnicos.registrar(tecnicos.datosRegistro.parse(req.body)))
}

export async function crearCuenta(req: Request, res: Response) {
  res.status(201).json(await tecnicos.crearCuenta(idRuta.parse(req.params.id)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await tecnicos.editar(id, tecnicos.datosTecnico.parse(req.body)))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await tecnicos.cambiarEstado(id, tecnicos.datosEstado.parse(req.body)))
}
