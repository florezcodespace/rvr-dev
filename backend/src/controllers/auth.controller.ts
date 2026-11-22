import type { Request, Response } from 'express'
import * as auth from '../models/auth.model.js'

/** IP de quien llama, para el registro de accesos (HU_74). */
const ipDe = (req: Request) =>
  (req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.socket.remoteAddress ?? '').slice(0, 45)

export async function login(req: Request, res: Response) {
  const datos = auth.credenciales.parse(req.body)
  res.json(await auth.login(datos, ipDe(req)))
}

export async function logout(req: Request, res: Response) {
  await auth.logout(req.sesion!, ipDe(req))
  res.status(204).end()
}

export async function logoutTodo(req: Request, res: Response) {
  await auth.logoutTodo(req.sesion!.usuarioId)
  res.status(204).end()
}

export async function recuperar(req: Request, res: Response) {
  const { correo } = auth.datosRecuperar.parse(req.body)
  res.json(await auth.recuperar(correo, ipDe(req)))
}

export async function validarEnlace(req: Request, res: Response) {
  res.json(await auth.validarEnlace(req.params.token))
}

export async function restablecer(req: Request, res: Response) {
  const datos = auth.datosRestablecer.parse(req.body)
  res.json(await auth.restablecer(datos, ipDe(req)))
}

export async function registro(req: Request, res: Response) {
  res.status(201).json(await auth.registrar(auth.datosRegistro.parse(req.body)))
}

export async function perfil(req: Request, res: Response) {
  res.json(await auth.perfil(req.sesion!.usuarioId))
}

export async function actualizarPerfil(req: Request, res: Response) {
  const d = auth.datosPerfil.parse(req.body)
  res.json(await auth.actualizarPerfil(req.sesion!.usuarioId, d))
}

export async function cambiarContrasena(req: Request, res: Response) {
  const d = auth.datosContrasena.parse(req.body)
  await auth.cambiarContrasena(req.sesion!.usuarioId, d)
  res.status(204).end()
}
