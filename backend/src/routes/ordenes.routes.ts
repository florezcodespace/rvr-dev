import { Router } from 'express'
import * as ordenes from '../controllers/ordenes.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Venta – Órdenes · Gestión de Órdenes de Servicio (HU_44 – HU_50). */
export const rutasOrdenes = Router()
rutasOrdenes.use(sesion)

rutasOrdenes.get('/', permiso('ordenes.listar', 'ordenes.buscar'), asincrono(ordenes.listar))
rutasOrdenes.get('/cotizaciones-aprobadas', permiso('ordenes.registrar'), asincrono(ordenes.cotizacionesAprobadas))
rutasOrdenes.get('/:id', permiso('ordenes.ver_detalle'), asincrono(ordenes.detalle))
rutasOrdenes.post('/', permiso('ordenes.registrar'), asincrono(ordenes.registrar))
rutasOrdenes.patch('/:id/observaciones', permiso('ordenes.registrar_observaciones'), asincrono(ordenes.observaciones))
rutasOrdenes.patch(
  '/:id/items/:itemId',
  permiso('ordenes.cambiar_estado_item', 'ordenes.registrar_observaciones'),
  asincrono(ordenes.actualizarItem),
)
rutasOrdenes.patch('/:id/estado', permiso('ordenes.cambiar_estado'), asincrono(ordenes.cambiarEstado))
