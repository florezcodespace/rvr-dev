import type { Request, Response } from 'express'
import * as ordenes from '../models/ordenes.model.js'
import { idRuta } from '../utils/comun.js'
import { regla } from '../utils/errores.js'

export async function listar(req: Request, res: Response) {
  res.json(await ordenes.listar(ordenes.filtroOrdenes.parse(req.query)))
}

export async function cotizacionesAprobadas(_req: Request, res: Response) {
  res.json(await ordenes.cotizacionesAprobadas())
}

export async function detalle(req: Request, res: Response) {
  res.json(await ordenes.detalleConGarantia(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  const d = ordenes.datosOrden.parse(req.body)
  res.status(201).json(await ordenes.registrar(d, req.sesion!.usuarioId))
}

export async function observaciones(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const { observaciones } = ordenes.datosObservaciones.parse(req.body)
  res.json(await ordenes.registrarObservaciones(id, observaciones, req.sesion!.usuarioId))
}

export async function actualizarItem(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const itemId = idRuta.parse(req.params.itemId)
  const d = ordenes.datosItem.parse(req.body)
  const s = req.sesion!
  // Con solo «registrar observaciones» se pueden escribir notas, no cambiar el estado.
  if (d.estado && !s.permisos.has('ordenes.cambiar_estado_item')) {
    throw regla('SIN_PERMISO', 'Tu rol no puede cambiar el estado de los ítems.')
  }
  res.json(await ordenes.actualizarItem(id, itemId, d, s.usuarioId))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await ordenes.cambiarEstado(id, ordenes.datosEstado.parse(req.body), req.sesion!.usuarioId))
}
