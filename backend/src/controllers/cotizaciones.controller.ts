import type { Request, Response } from 'express'
import * as cotizaciones from '../models/cotizaciones.model.js'
import { idRuta } from '../utils/comun.js'

export async function listar(req: Request, res: Response) {
  res.json(await cotizaciones.listar(cotizaciones.filtroCotizaciones.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await cotizaciones.detalleCotizacion(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await cotizaciones.registrar(cotizaciones.datosCotizacion.parse(req.body)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await cotizaciones.editar(id, cotizaciones.datosEdicion.parse(req.body)))
}

export async function enviar(req: Request, res: Response) {
  res.json(await cotizaciones.enviar(idRuta.parse(req.params.id)))
}

/** HU_40 · El cliente respondió por teléfono, WhatsApp o en persona. */
export async function decision(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  const d = cotizaciones.datosDecision.parse(req.body)
  res.json(await cotizaciones.registrarDecision(id, d.decision, d.motivo, req.sesion!.usuarioId, 'administrador'))
}
