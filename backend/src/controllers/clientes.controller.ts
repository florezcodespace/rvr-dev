import type { Request, Response } from 'express'
import * as clientes from '../models/clientes.model.js'
import { idRuta } from '../utils/comun.js'

export async function opciones(req: Request, res: Response) {
  res.json(await clientes.opciones(clientes.filtroOpciones.parse(req.query)))
}

export async function disponible(req: Request, res: Response) {
  res.json(await clientes.disponible(clientes.filtroDisponible.parse(req.query)))
}

export async function darAcceso(req: Request, res: Response) {
  res.status(201).json(await clientes.darAcceso(idRuta.parse(req.params.id)))
}

export async function listar(req: Request, res: Response) {
  res.json(await clientes.listar(clientes.filtroClientes.parse(req.query)))
}

export async function detalle(req: Request, res: Response) {
  res.json(await clientes.detalle(idRuta.parse(req.params.id)))
}

export async function registrar(req: Request, res: Response) {
  res.status(201).json(await clientes.registrar(clientes.datosCliente.parse(req.body)))
}

export async function editar(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await clientes.editar(id, clientes.datosCliente.parse(req.body)))
}

export async function cambiarEstado(req: Request, res: Response) {
  const id = idRuta.parse(req.params.id)
  res.json(await clientes.cambiarEstado(id, clientes.datosEstado.parse(req.body)))
}
