import type { Request, Response } from 'express'
import * as notificaciones from '../models/notificaciones.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await notificaciones.listar(req.sesion!.usuarioId))
}

export async function marcarLeida(req: Request, res: Response) {
  await notificaciones.marcarLeida(idRuta.parse(req.params.id), req.sesion!.usuarioId)
  res.status(204).end()
}

export async function leerTodas(req: Request, res: Response) {
  await notificaciones.leerTodas(req.sesion!.usuarioId)
  res.status(204).end()
}

/** Buscador global (⌘K). */
export async function buscar(req: Request, res: Response) {
  const { q } = notificaciones.filtroBusqueda.parse(req.query)
  res.json(await notificaciones.buscar(q, req.sesion!.permisos))
}
