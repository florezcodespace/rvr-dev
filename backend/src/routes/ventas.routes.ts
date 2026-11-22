import { Router } from 'express'
import * as ventas from '../controllers/ventas.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Venta – Órdenes · Gestión de Ventas (HU_55 – HU_57) y de Abonos (HU_58 – HU_59). */
export const rutasVentas = Router()
export const rutasAbonos = Router()
rutasVentas.use(sesion)
rutasAbonos.use(sesion)

rutasVentas.get('/', permiso('ventas.consultar_estado'), asincrono(ventas.listar))
rutasVentas.get('/ordenes-sin-venta', permiso('ventas.registrar'), asincrono(ventas.ordenesSinVenta))
rutasVentas.get('/orden/:ordenId', permiso('ventas.consultar_estado'), asincrono(ventas.ventaDeOrden))
rutasVentas.get('/:id', permiso('ventas.consultar_estado'), asincrono(ventas.detalle))
rutasVentas.post('/', permiso('ventas.registrar'), asincrono(ventas.registrar))
rutasVentas.patch('/:id/estado', permiso('ventas.cambiar_estado'), asincrono(ventas.cambiarEstado))

rutasAbonos.get('/', permiso('abonos.listar'), asincrono(ventas.listarAbonos))
rutasAbonos.get('/ventas-con-saldo', permiso('abonos.registrar'), asincrono(ventas.ventasConSaldo))
rutasAbonos.post('/', permiso('abonos.registrar'), asincrono(ventas.registrarAbono))
