import { Router } from 'express'
import * as movil from '../controllers/movil.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/**
 * API de la aplicación móvil del técnico (Proceso Móvil de la ficha).
 *
 *   Acceso móvil          POST /api/auth/login {usuario, contrasena, canal:"movil"}
 *                         POST /api/auth/logout            (invalida el token)
 *   Seguimiento órdenes   GET  /api/movil/ordenes           HU_03
 *                         GET  /api/movil/ordenes/:id
 *                         POST /api/movil/visitas/:id/inicio HU_04
 *                         POST /api/movil/visitas/:id/fin    HU_05
 *                         PATCH /api/movil/ordenes/:id/estado HU_09
 *                         GET  /api/movil/ordenes/:id/historial HU_10
 *   Reporte técnico       PUT  /api/movil/ordenes/:id/diagnostico HU_06
 *                         POST /api/movil/ordenes/:id/materiales  HU_07
 *                         PUT  /api/movil/ordenes/:id/solucion    HU_08
 *                         POST /api/movil/ordenes/:id/recotizacion HU_11
 */
export const rutasMovil = Router()
rutasMovil.use(sesion)

rutasMovil.get('/ordenes', permiso('movil.consultar_ordenes'), asincrono(movil.ordenes))
rutasMovil.get('/ordenes/:id', permiso('movil.consultar_ordenes'), asincrono(movil.orden))
rutasMovil.get('/ordenes/:id/historial', permiso('movil.consultar_historial'), asincrono(movil.historial))
rutasMovil.post('/visitas/:id/inicio', permiso('movil.registrar_visita'), asincrono(movil.iniciarVisita))
rutasMovil.post('/visitas/:id/fin', permiso('movil.registrar_visita'), asincrono(movil.finalizarVisita))
rutasMovil.patch('/ordenes/:id/estado', permiso('movil.actualizar_estado'), asincrono(movil.cambiarEstado))
rutasMovil.put('/ordenes/:id/diagnostico', permiso('movil.reporte_tecnico'), asincrono(movil.diagnostico))
rutasMovil.put('/ordenes/:id/solucion', permiso('movil.reporte_tecnico'), asincrono(movil.solucion))
rutasMovil.post('/ordenes/:id/materiales', permiso('movil.reporte_tecnico'), asincrono(movil.registrarMateriales))
rutasMovil.get('/ordenes/:id/materiales', permiso('movil.reporte_tecnico', 'movil.consultar_ordenes'), asincrono(movil.materiales))
rutasMovil.post('/ordenes/:id/recotizacion', permiso('movil.solicitar_recotizacion'), asincrono(movil.recotizacion))
rutasMovil.patch('/ordenes/:id/items/:itemId', permiso('movil.reporte_tecnico'), asincrono(movil.actualizarItem))
