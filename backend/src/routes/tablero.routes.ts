import { Router } from 'express'
import * as tablero from '../controllers/tablero.controller.js'
import { asincrono } from '../middlewares/errores.js'
import { permiso, sesion } from '../middlewares/sesion.js'

/** Dashboard: Reportes (HU_60 – HU_62), Indicadores (HU_63 – HU_64) y Estadísticas (HU_65). */
export const rutasReportes = Router()
export const rutasIndicadores = Router()
export const rutasEstadisticas = Router()
rutasReportes.use(sesion)
rutasIndicadores.use(sesion)
rutasEstadisticas.use(sesion)

rutasReportes.get('/ordenes', permiso('reportes.ordenes'), asincrono(tablero.reporteOrdenes))
rutasReportes.get('/tecnicos', permiso('reportes.tecnicos'), asincrono(tablero.reporteTecnicos))

rutasIndicadores.get('/servicios-ordenes', permiso('indicadores.servicios_ordenes'), asincrono(tablero.serviciosOrdenes))
rutasIndicadores.get('/mas-solicitados', permiso('indicadores.mas_solicitados'), asincrono(tablero.masSolicitados))

rutasEstadisticas.get('/', permiso('estadisticas.consultar'), asincrono(tablero.estadisticas))
