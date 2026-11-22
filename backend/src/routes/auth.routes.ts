import { Router } from 'express'
import * as auth from '../controllers/auth.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { sesion } from '../middlewares/sesion.js'

/**
 * Gestión de Acceso (HU_13, HU_14, HU_72, HU_73) y Autogestión de la cuenta
 * (HU_75, HU_77 · contraseña). Lo usan la web y la aplicación móvil.
 * Login, recuperación, restablecimiento y registro no piden sesión.
 */
export const rutasAuth = Router()

rutasAuth.post('/login', asincrono(auth.login))
rutasAuth.post('/logout', sesion, asincrono(auth.logout))
rutasAuth.post('/logout-todo', sesion, asincrono(auth.logoutTodo))
rutasAuth.post('/recuperar', asincrono(auth.recuperar))
rutasAuth.get('/restablecer/:token', asincrono(auth.validarEnlace))
rutasAuth.post('/restablecer', asincrono(auth.restablecer))
rutasAuth.post('/registro', asincrono(auth.registro))
rutasAuth.get('/perfil', sesion, asincrono(auth.perfil))
rutasAuth.put('/perfil', sesion, asincrono(auth.actualizarPerfil))
rutasAuth.post('/contrasena', sesion, asincrono(auth.cambiarContrasena))
