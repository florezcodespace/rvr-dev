import { Router } from 'express'
import * as disponibilidad from '../controllers/disponibilidad.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Servicios · Gestión de Horarios Técnicos (HU_28 – HU_30). */
export const rutasDisponibilidad = Router()
rutasDisponibilidad.use(sesion)

rutasDisponibilidad.get('/', permiso('disponibilidad.consultar', 'agenda.agendar', 'agenda.reprogramar'), asincrono(disponibilidad.listar))
rutasDisponibilidad.get('/libres', permiso('agenda.agendar', 'agenda.reprogramar'), asincrono(disponibilidad.libres))
rutasDisponibilidad.post('/', permiso('disponibilidad.registrar'), asincrono(disponibilidad.registrar))
rutasDisponibilidad.patch('/:id/estado', permiso('disponibilidad.cambiar_estado'), asincrono(disponibilidad.cambiarEstado))
