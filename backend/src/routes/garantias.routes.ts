import { Router } from 'express'
import * as garantias from '../controllers/garantias.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** [Feedback 13] Garantías de las órdenes y sus reclamos. */
export const rutasGarantias = Router()
rutasGarantias.use(sesion)

rutasGarantias.get('/', permiso('ordenes.gestionar_garantias'), asincrono(garantias.listar))
rutasGarantias.get('/:id', permiso('ordenes.gestionar_garantias'), asincrono(garantias.detalle))
rutasGarantias.post('/reclamos/:id/aprobar', permiso('ordenes.gestionar_garantias'), asincrono(garantias.aprobarReclamo))
rutasGarantias.post('/reclamos/:id/rechazar', permiso('ordenes.gestionar_garantias'), asincrono(garantias.rechazarReclamo))
