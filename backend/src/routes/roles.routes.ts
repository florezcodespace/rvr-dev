import { Router } from 'express'
import * as roles from '../controllers/roles.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Configuración · Gestión de Roles (HU_01 – HU_06). */
export const rutasRoles = Router()
rutasRoles.use(sesion)

rutasRoles.get('/', permiso('roles.listar', 'roles.buscar'), asincrono(roles.listar))
rutasRoles.get('/opciones', permiso('usuarios.registrar', 'usuarios.editar', 'usuarios.listar'), asincrono(roles.opciones))
rutasRoles.get('/:id', permiso('roles.ver_detalle', 'roles.editar'), asincrono(roles.detalle))
rutasRoles.post('/', permiso('roles.registrar'), asincrono(roles.registrar))
rutasRoles.put('/:id', permiso('roles.editar'), asincrono(roles.editar))
rutasRoles.patch('/:id/estado', permiso('roles.cambiar_estado'), asincrono(roles.cambiarEstado))
rutasRoles.delete('/:id', permiso('roles.eliminar'), asincrono(roles.eliminar))
