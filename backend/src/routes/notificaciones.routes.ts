import { Router } from 'express'
import * as notificaciones from '../controllers/notificaciones.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { sesion } from '../middlewares/sesion.js'

/** Campana de avisos: cada cuenta ve solo los suyos. */
export const rutasNotificaciones = Router()
rutasNotificaciones.use(sesion)

rutasNotificaciones.get('/', asincrono(notificaciones.listar))
rutasNotificaciones.patch('/:id/leida', asincrono(notificaciones.marcarLeida))
rutasNotificaciones.post('/leer-todas', asincrono(notificaciones.leerTodas))

/** Buscador global del portal administrativo (⌘K). Solo lo que el rol puede ver. */
export const rutasBusqueda = Router()
rutasBusqueda.use(sesion)

rutasBusqueda.get('/', asincrono(notificaciones.buscar))
