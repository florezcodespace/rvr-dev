import { Router } from 'express'
import * as accesos from '../controllers/accesos.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Gestión de Acceso · HU_74. CA_74_04 · solo lectura: no hay POST, PUT ni DELETE. */
export const rutasAccesos = Router()
rutasAccesos.use(sesion, permiso('accesos.consultar'))

rutasAccesos.get('/', asincrono(accesos.listar))
