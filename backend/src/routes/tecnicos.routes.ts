import { Router } from 'express'
import * as tecnicos from '../controllers/tecnicos.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Servicios · Gestión de Técnicos (HU_22 – HU_27). */
export const rutasTecnicos = Router()
rutasTecnicos.use(sesion)

rutasTecnicos.get(
  '/especialidades',
  permiso('tecnicos.listar', 'tecnicos.buscar', 'disponibilidad.consultar', 'agenda.agendar'),
  asincrono(tecnicos.especialidades),
)
rutasTecnicos.get(
  '/opciones',
  permiso('tecnicos.listar', 'disponibilidad.consultar', 'disponibilidad.registrar', 'agenda.consultar', 'agenda.agendar',
    'reportes.tecnicos', 'reportes.ordenes', 'ordenes.listar'),
  asincrono(tecnicos.opciones),
)
rutasTecnicos.get('/', permiso('tecnicos.listar', 'tecnicos.buscar'), asincrono(tecnicos.listar))
rutasTecnicos.get('/:id', permiso('tecnicos.ver_detalle', 'tecnicos.editar'), asincrono(tecnicos.detalle))
rutasTecnicos.post('/', permiso('tecnicos.registrar'), asincrono(tecnicos.registrar))
rutasTecnicos.post('/:id/cuenta', permiso('tecnicos.editar'), asincrono(tecnicos.crearCuenta))
rutasTecnicos.put('/:id', permiso('tecnicos.editar'), asincrono(tecnicos.editar))
rutasTecnicos.patch('/:id/estado', permiso('tecnicos.cambiar_estado'), asincrono(tecnicos.cambiarEstado))
