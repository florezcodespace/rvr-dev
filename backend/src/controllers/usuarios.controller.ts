import type { Request, Response } from 'express'
import * as usuarios from '../models/usuarios.model.js'
import { idRuta } from '../utils/comun.js'

export async function disponible(req: Request, res: Response) {
  res.json(await usuarios.disponible(usuarios.filtroDisponible.parse(req.query)))
}

export async function listar(req: Request, res: Response) {
  res.json(await usuarios.listar(usuarios.filtroUsuarios.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await usuarios.detalle(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await usuarios.registrar(usuarios.datosUsuario.parse(req.body)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await usuarios.editar(id, usuarios.datosUsuario.parse(req.body), req.sesion!.usuarioId))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { estado } = usuarios.datosEstado.parse(req.body)
  res.json(await usuarios.cambiarEstado(id, estado, req.sesion!.usuarioId))
}

export async function restablecerContrasena(req: Request, res: Response) {
  res.json(await usuarios.restablecerContrasena(idRuta.parse(req.params.id)))
}
