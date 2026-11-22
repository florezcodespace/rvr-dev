import type { Request, Response } from 'express'
import * as portal from '../models/portal.model.js'
import { ErrorHttp } from '../utils/errores.js'

/** El cliente de la sesión: todo el portal va filtrado por él. */
function clienteDe(req: Request): number {
  const id = req.sesion?.clienteId
  if (!id) throw new ErrorHttp(403, 'SIN_CLIENTE', 'Tu cuenta no está vinculada a un cliente.')
  return id
}

export async function perfil(req: Request, res: Response) {
  res.json(await portal.perfil(clienteDe(req)))
}

export async function actualizarPerfil(req: Request, res: Response) {
  const clienteId = clienteDe(req)
  const d = portal.datosPerfil.parse(req.body)
  res.json(await portal.actualizarPerfil(clienteId, req.sesion!.usuarioId, d))
}

export async function resumen(req: Request, res: Response) {
  res.json(await portal.resumen(clienteDe(req)))
}

export async function misCotizaciones(req: Request, res: Response) {
  res.json(await portal.misCotizaciones(clienteDe(req)))
}

export async function miCotizacion(req: Request, res: Response) {
  const clienteId = clienteDe(req)
  res.json(await portal.miCotizacion(clienteId, portal.idPortal.parse(req.params.id)))
}

export async function solicitar(req: Request, res: Response) {
  const clienteId = clienteDe(req)
  res.status(201).json(await portal.solicitar(clienteId, portal.datosSolicitud.parse(req.body)))
}

export async function decidir(req: Request, res: Response) {
  const clienteId = clienteDe(req)
  const id = portal.idPortal.parse(req.params.id)
  const d = portal.datosDecision.parse(req.body)
  res.json(await portal.decidir(clienteId, id, d, req.sesion!.usuarioId))
}

export async function misOrdenes(req: Request, res: Response) {
  res.json(await portal.misOrdenes(clienteDe(req)))
}

export async function miOrden(req: Request, res: Response) {
  const clienteId = clienteDe(req)
  res.json(await portal.miOrden(clienteId, portal.idPortal.parse(req.params.id)))
}

/** La orden de la ruta, si es del cliente de la sesión. */
async function ordenPropia(req: Request) {
  const clienteId = clienteDe(req)
  return portal.ordenPropia(clienteId, portal.idPortal.parse(req.params.id))
}

export async function subirComprobante(req: Request, res: Response) {
  const o = await ordenPropia(req)
  res.status(201).json(await portal.subirComprobante(o, req.sesion!.usuarioId, req.body))
}

export async function reclamarGarantia(req: Request, res: Response) {
  const o = await ordenPropia(req)
  const { descripcion } = portal.datosReclamo.parse(req.body)
  res.status(201).json(await portal.reclamar(o, descripcion))
}
