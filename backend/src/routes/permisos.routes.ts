import { Router } from 'express'
import * as permisos from '../controllers/permisos.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Configuración · Gestión de Permisos (HU_66 – HU_71). */
export const rutasPermisos = Router()
rutasPermisos.use(sesion)

rutasPermisos.get(
  '/modulos',
  permiso('permisos.listar', 'permisos.buscar', 'permisos.registrar', 'permisos.editar', 'roles.registrar', 'roles.editar'),
  asincrono(permisos.modulos),
)
rutasPermisos.get('/catalogo', permiso('roles.registrar', 'roles.editar', 'roles.ver_detalle'), asincrono(permisos.catalogo))
rutasPermisos.get('/', permiso('permisos.listar', 'permisos.buscar'), asincrono(permisos.listar))
rutasPermisos.get('/:id', permiso('permisos.ver_detalle', 'permisos.editar'), asincrono(permisos.detalle))
rutasPermisos.post('/', permiso('permisos.registrar'), asincrono(permisos.registrar))
rutasPermisos.put('/:id', permiso('permisos.editar'), asincrono(permisos.editar))
rutasPermisos.patch('/:id/estado', permiso('permisos.cambiar_estado'), asincrono(permisos.cambiarEstado))
