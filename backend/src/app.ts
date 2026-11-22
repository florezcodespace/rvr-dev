import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { pool } from './db.js'
import { manejadorDeErrores } from './middlewares/errores.js'
import { rutasAuth } from './routes/auth.routes.js'
import { rutasAccesos } from './routes/accesos.routes.js'
import { rutasAgenda } from './routes/agenda.routes.js'
import { rutasClientes } from './routes/clientes.routes.js'
import { rutasComprobantes } from './routes/comprobantes.routes.js'
import { rutasCotizaciones } from './routes/cotizaciones.routes.js'
import { rutasDisponibilidad } from './routes/disponibilidad.routes.js'
import { rutasMovil } from './routes/movil.routes.js'
import { rutasBusqueda, rutasNotificaciones } from './routes/notificaciones.routes.js'
import { rutasGarantias } from './routes/garantias.routes.js'
import { rutasOrdenes } from './routes/ordenes.routes.js'
import { rutasPermisos } from './routes/permisos.routes.js'
import { rutasPortal } from './routes/portal.routes.js'
import { rutasRoles } from './routes/roles.routes.js'
import { rutasPublico, rutasServicios } from './routes/servicios.routes.js'
import { rutasEstadisticas, rutasIndicadores, rutasReportes } from './routes/tablero.routes.js'
import { rutasTecnicos } from './routes/tecnicos.routes.js'
import { rutasUsuarios } from './routes/usuarios.routes.js'
import { rutasAbonos, rutasVentas } from './routes/ventas.routes.js'

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
  // 5 MB: los comprobantes de pago llegan como imagen o PDF en base64 (feedback 12)
  app.use(express.json({ limit: '5mb' }))

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
  app.use('/api/comprobantes', rutasComprobantes)
  app.use('/api/garantias', rutasGarantias)
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
