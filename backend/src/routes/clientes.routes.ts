import { Router } from 'express'
import * as clientes from '../controllers/clientes.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Venta – Órdenes · Gestión de Clientes (HU_31 – HU_35, HU_83). */
export const rutasClientes = Router()
rutasClientes.use(sesion)

rutasClientes.get(
  '/opciones',
  permiso('cotizaciones.registrar', 'clientes.listar', 'reportes.ordenes', 'ordenes.listar'),
  asincrono(clientes.opciones),
)
rutasClientes.get('/disponible', permiso('clientes.registrar', 'clientes.editar', 'usuarios.registrar'), asincrono(clientes.disponible))
rutasClientes.get('/', permiso('clientes.listar', 'clientes.buscar'), asincrono(clientes.listar))
rutasClientes.get('/:id', permiso('clientes.ver_detalle', 'clientes.editar'), asincrono(clientes.detalle))
rutasClientes.post('/', permiso('clientes.registrar'), asincrono(clientes.registrar))
rutasClientes.post('/:id/acceso', permiso('clientes.editar'), asincrono(clientes.darAcceso))
rutasClientes.put('/:id', permiso('clientes.editar'), asincrono(clientes.editar))
rutasClientes.patch('/:id/estado', permiso('clientes.cambiar_estado'), asincrono(clientes.cambiarEstado))
