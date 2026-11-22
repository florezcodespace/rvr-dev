import { Router } from 'express'
import * as servicios from '../controllers/servicios.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Servicios · Catálogo de Servicios (HU_15 – HU_20). */
export const rutasServicios = Router()
rutasServicios.use(sesion)

rutasServicios.get('/categorias', asincrono(servicios.categorias))
rutasServicios.get('/', permiso('servicios.listar', 'servicios.buscar', 'cotizaciones.registrar', 'cotizaciones.editar'), asincrono(servicios.listar))
rutasServicios.get('/:id', permiso('servicios.ver_detalle', 'servicios.editar'), asincrono(servicios.detalle))
rutasServicios.post('/', permiso('servicios.registrar'), asincrono(servicios.registrar))
rutasServicios.put('/:id', permiso('servicios.editar'), asincrono(servicios.editar))
rutasServicios.patch('/:id/estado', permiso('servicios.cambiar_estado'), asincrono(servicios.cambiarEstado))

/** HU_21 · Catálogo público: sin sesión (CA_21_01). */
export const rutasPublico = Router()

rutasPublico.get('/servicios', asincrono(servicios.catalogoPublico))
