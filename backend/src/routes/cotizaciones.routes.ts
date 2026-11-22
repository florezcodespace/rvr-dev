import { Router } from 'express'
import * as cotizaciones from '../controllers/cotizaciones.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Venta – Órdenes · Gestión de Cotizaciones (HU_36 – HU_41, HU_81). */
export const rutasCotizaciones = Router()
rutasCotizaciones.use(sesion)

rutasCotizaciones.get('/', permiso('cotizaciones.listar', 'cotizaciones.buscar'), asincrono(cotizaciones.listar))
rutasCotizaciones.get('/:id', permiso('cotizaciones.ver_detalle', 'cotizaciones.editar'), asincrono(cotizaciones.detalle))
rutasCotizaciones.post('/', permiso('cotizaciones.registrar'), asincrono(cotizaciones.registrar))
rutasCotizaciones.put('/:id', permiso('cotizaciones.editar'), asincrono(cotizaciones.editar))
rutasCotizaciones.post('/:id/enviar', permiso('cotizaciones.enviar'), asincrono(cotizaciones.enviar))
rutasCotizaciones.post('/:id/decision', permiso('cotizaciones.registrar_decision'), asincrono(cotizaciones.decision))
