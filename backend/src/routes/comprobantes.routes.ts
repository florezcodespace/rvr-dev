import { Router } from 'express'
import * as comprobantes from '../controllers/comprobantes.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** [Feedback 12] Comprobantes de pago que sube el cliente y revisa RvR. */
export const rutasComprobantes = Router()
rutasComprobantes.use(sesion)

rutasComprobantes.get('/', permiso('abonos.revisar_comprobantes', 'abonos.listar'), asincrono(comprobantes.listar))
rutasComprobantes.get('/:id', permiso('abonos.revisar_comprobantes', 'abonos.listar'), asincrono(comprobantes.detalle))
rutasComprobantes.post('/:id/aprobar', permiso('abonos.revisar_comprobantes'), asincrono(comprobantes.aprobar))
rutasComprobantes.post('/:id/rechazar', permiso('abonos.revisar_comprobantes'), asincrono(comprobantes.rechazar))
