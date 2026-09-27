import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { pool } from './db.js'
import { manejadorDeErrores } from './errores.js'
import { rutasAuth } from './auth/rutas.js'
import { rutasAccesos } from './modulos/accesos.js'
import { rutasAgenda } from './modulos/agenda.js'
import { rutasClientes } from './modulos/clientes.js'
import { rutasCotizaciones } from './modulos/cotizaciones.js'
import { rutasDisponibilidad } from './modulos/disponibilidad.js'
import { rutasMovil } from './modulos/movil.js'
import { rutasBusqueda, rutasNotificaciones } from './modulos/notificaciones.js'
import { rutasOrdenes } from './modulos/ordenes.js'
import { rutasPermisos } from './modulos/permisos.js'
import { rutasPortal } from './modulos/portal.js'
import { rutasRoles } from './modulos/roles.js'
import { rutasPublico, rutasServicios } from './modulos/servicios.js'
import { rutasEstadisticas, rutasIndicadores, rutasReportes } from './modulos/tablero.js'
import { rutasTecnicos } from './modulos/tecnicos.js'
import { rutasUsuarios } from './modulos/usuarios.js'
import { rutasAbonos, rutasVentas } from './modulos/ventas.js'

const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+):\d+$/

export function crearApp() {
  const app = express()

  app.use(
    cors({
      // Lista blanca: CORS_ORIGIN más cualquier puerto local o de la red de la
      // oficina (la app móvil en desarrollo corre en 192.168.x.x). Una app
      // móvil nativa no envía Origin y pasa sin esta revisión.
      origin: (origen, listo) => {
        if (!origen || config.origenes.includes(origen) || LOCAL.test(origen)) listo(null, true)
        else listo(new Error(`Origen no permitido: ${origen}`))
      },
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/salud', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT now() AS ahora')
      res.json({ ok: true, base: 'conectada', ahora: rows[0].ahora, version: 'v6' })
    } catch {
      res.status(503).json({ ok: false, base: 'sin conexión' })
    }
  })

  // Acceso (web y móvil)
  app.use('/api/auth', rutasAuth)
  // Público: catálogo sin sesión (HU_21)
  app.use('/api/publico', rutasPublico)
  // Configuración y usuarios
  app.use('/api/roles', rutasRoles)
  app.use('/api/permisos', rutasPermisos)
  app.use('/api/usuarios', rutasUsuarios)
  app.use('/api/accesos', rutasAccesos)
  // Servicios
  app.use('/api/servicios', rutasServicios)
  app.use('/api/tecnicos', rutasTecnicos)
  app.use('/api/disponibilidad', rutasDisponibilidad)
  // Venta – Órdenes
  app.use('/api/clientes', rutasClientes)
  app.use('/api/cotizaciones', rutasCotizaciones)
  app.use('/api/ordenes', rutasOrdenes)
  app.use('/api/agenda', rutasAgenda)
  app.use('/api/ventas', rutasVentas)
  app.use('/api/abonos', rutasAbonos)
  // Dashboard
  app.use('/api/reportes', rutasReportes)
  app.use('/api/indicadores', rutasIndicadores)
  app.use('/api/estadisticas', rutasEstadisticas)
  // Transversal
  app.use('/api/notificaciones', rutasNotificaciones)
  app.use('/api/busqueda', rutasBusqueda)
  // Portal del cliente y aplicación móvil del técnico
  app.use('/api/portal', rutasPortal)
  app.use('/api/movil', rutasMovil)

  app.use((_req, res) => {
    res.status(404).json({ codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'Esa ruta no existe.' })
  })
  app.use(manejadorDeErrores)

  return app
}
