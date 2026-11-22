import { Router } from 'express'
import * as portal from '../controllers/portal.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Portal del cliente (HU_76 – HU_80, HU_82). Todo filtrado por el cliente de la sesión. */
export const rutasPortal = Router()
rutasPortal.use(sesion)

rutasPortal.get('/perfil', permiso('portal.consultar_perfil'), asincrono(portal.perfil))
rutasPortal.put('/perfil', permiso('portal.actualizar_perfil'), asincrono(portal.actualizarPerfil))
rutasPortal.get('/resumen', asincrono(portal.resumen))

rutasPortal.get('/cotizaciones', permiso('portal.consultar_cotizaciones'), asincrono(portal.misCotizaciones))
rutasPortal.get('/cotizaciones/:id', permiso('portal.consultar_cotizaciones'), asincrono(portal.miCotizacion))
rutasPortal.post('/solicitudes', permiso('portal.solicitar_servicios'), asincrono(portal.solicitar))
rutasPortal.post('/cotizaciones/:id/decision', permiso('portal.decidir_cotizacion'), asincrono(portal.decidir))

rutasPortal.get('/ordenes', permiso('portal.consultar_ordenes'), asincrono(portal.misOrdenes))
rutasPortal.get('/ordenes/:id', permiso('portal.consultar_ordenes'), asincrono(portal.miOrden))
rutasPortal.post('/ordenes/:id/comprobantes', permiso('portal.subir_comprobante'), asincrono(portal.subirComprobante))
rutasPortal.post('/ordenes/:id/garantia', permiso('portal.reclamar_garantia'), asincrono(portal.reclamarGarantia))
