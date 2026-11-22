import type { Request, Response } from 'express'
import * as movil from '../models/movil.model.js'
import { idRuta } from '../utils/comun.js'
import { ErrorHttp } from '../utils/errores.js'

/** El técnico de la sesión: la app móvil solo trabaja con lo suyo. */
function tecnicoDe(req: Request): number {
  const id = req.sesion?.tecnicoId
  if (!id) throw new ErrorHttp(403, 'SOLO_TECNICOS', 'Tu cuenta no está vinculada a un técnico activo.')
  return id
}

const quien = (req: Request) => ({ usuarioId: req.sesion!.usuarioId, nombre: req.sesion!.nombre })

export async function ordenes(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  res.json(await movil.ordenes(tecnicoId, movil.filtroOrdenes.parse(req.query)))
}

export async function orden(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  res.json(await movil.orden(idRuta.parse(req.params.id), tecnicoId))
}

export async function historial(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  res.json(await movil.historial(idRuta.parse(req.params.id), tecnicoId))
}

export async function iniciarVisita(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const v = await movil.visitaPropia(idRuta.parse(req.params.id), tecnicoId)
  res.json(await movil.iniciarVisita(v, quien(req)))
}

export async function finalizarVisita(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const v = await movil.visitaPropia(idRuta.parse(req.params.id), tecnicoId)
  const { notas } = movil.datosFin.parse(req.body ?? {})
  res.json(await movil.finalizarVisita(v, notas, quien(req)))
}

export async function cambiarEstado(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const id = idRuta.parse(req.params.id)
  const d = movil.datosEstado.parse(req.body)
  res.json(await movil.cambiarEstado(id, tecnicoId, d, req.sesion!.usuarioId))
}

export async function diagnostico(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const id = idRuta.parse(req.params.id)
  const { hallazgos } = movil.datosDiagnostico.parse(req.body)
  res.json(await movil.registrarDiagnostico(id, tecnicoId, hallazgos, req.sesion!.usuarioId))
}

export async function solucion(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const id = idRuta.parse(req.params.id)
  const { solucion } = movil.datosSolucion.parse(req.body)
  res.json(await movil.registrarSolucion(id, tecnicoId, solucion, req.sesion!.usuarioId))
}

export async function registrarMateriales(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const id = idRuta.parse(req.params.id)
  const { materiales } = movil.datosMateriales.parse(req.body)
  res.status(201).json(await movil.registrarMateriales(id, tecnicoId, materiales, req.sesion!.usuarioId))
}

export async function materiales(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  res.json(await movil.materiales(idRuta.parse(req.params.id), tecnicoId))
}

export async function recotizacion(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const id = idRuta.parse(req.params.id)
  const d = movil.datosRecotizacion.parse(req.body)
  res.status(201).json(await movil.solicitarRecotizacion(id, tecnicoId, d, quien(req)))
}

export async function actualizarItem(req: Request, res: Response) {
  const tecnicoId = tecnicoDe(req)
  const id = idRuta.parse(req.params.id)
  const itemId = idRuta.parse(req.params.itemId)
  const d = movil.datosItem.parse(req.body)
  res.json(await movil.actualizarItem(id, itemId, tecnicoId, d))
}
