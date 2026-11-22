import { Router } from 'express'
import * as agenda from '../controllers/agenda.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Venta – Órdenes · Agendamiento (HU_51 – HU_54). */
export const rutasAgenda = Router()
rutasAgenda.use(sesion)

rutasAgenda.get('/', permiso('agenda.consultar'), asincrono(agenda.listar))
rutasAgenda.get('/ordenes', permiso('agenda.agendar'), asincrono(agenda.ordenes))
rutasAgenda.post('/', permiso('agenda.agendar'), asincrono(agenda.agendar))
rutasAgenda.post('/:id/reprogramar', permiso('agenda.reprogramar'), asincrono(agenda.reprogramar))
rutasAgenda.patch('/:id/estado', permiso('agenda.cambiar_estado'), asincrono(agenda.cambiarEstado))
