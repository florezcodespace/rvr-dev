import type { Request, Response } from 'express'
import * as accesos from '../models/accesos.model.js'

/** HU_74 · Registro de accesos (solo lectura). */
export async function listar(req: Request, res: Response) {
  res.json(await accesos.listar(accesos.filtroAccesos.parse(req.query)))
}
