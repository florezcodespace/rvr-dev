import { Router } from 'express'
import * as usuarios from '../controllers/usuarios.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Usuarios · Gestión de Usuarios (HU_07 – HU_12). */
export const rutasUsuarios = Router()
rutasUsuarios.use(sesion)

rutasUsuarios.get('/disponible', permiso('usuarios.registrar', 'usuarios.editar'), asincrono(usuarios.disponible))
rutasUsuarios.get('/', permiso('usuarios.listar', 'usuarios.buscar'), asincrono(usuarios.listar))
rutasUsuarios.get('/:id', permiso('usuarios.ver_detalle', 'usuarios.editar'), asincrono(usuarios.detalle))
rutasUsuarios.post('/', permiso('usuarios.registrar'), asincrono(usuarios.registrar))
rutasUsuarios.put('/:id', permiso('usuarios.editar'), asincrono(usuarios.editar))
rutasUsuarios.patch('/:id/estado', permiso('usuarios.cambiar_estado'), asincrono(usuarios.cambiarEstado))
rutasUsuarios.post('/:id/contrasena', permiso('usuarios.editar'), asincrono(usuarios.restablecerContrasena))
