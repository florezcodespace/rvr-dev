import type { Request, Response } from 'express'
import * as ventas from '../models/ventas.model.js'
import { idRuta } from '../utils/comun.js'

// ------------------------------------------------------------------ ventas

export async function listar(req: Request, res: Response) {
  res.json(await ventas.listar(ventas.filtroVentas.parse(req.query)))
}

export async function ordenesSinVenta(_req: Request, res: Response) {
  res.json(await ventas.ordenesSinVenta())
}

export async function ventaDeOrden(req: Request, res: Response) {
  res.json(await ventas.ventaDeOrden(idRuta.parse(req.params.ordenId)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await ventas.detalleVenta(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await ventas.registrar(ventas.datosVenta.parse(req.body), req.sesion!.usuarioId))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await ventas.cambiarEstado(id, ventas.datosEstado.parse(req.body), req.sesion!.usuarioId))
}

// ------------------------------------------------------------------ abonos

export async function listarAbonos(req: Request, res: Response) {
  res.json(await ventas.listarAbonos(ventas.filtroAbonos.parse(req.query)))
}

export async function ventasConSaldo(_req: Request, res: Response) {
  res.json(await ventas.ventasConSaldo())
}

export async function registrarAbono(req: Request, res: Response) {
  res.status(201).json(await ventas.abonar(ventas.datosAbono.parse(req.body), req.sesion!.usuarioId))
}
