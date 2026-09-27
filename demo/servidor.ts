/**
 * Modo demostración: la API real de RvR corriendo dentro del navegador.
 *
 * Los módulos de `api/src` se ejecutan sin cambios; solo se reemplazan las
 * piezas de Node (express, pg, jsonwebtoken, node:crypto) por equivalentes del
 * navegador (ver `demo/shims`). La base es PostgreSQL de verdad compilado a
 * WebAssembly (PGlite) y se carga con los mismos scripts de `db/`: esquema,
 * catálogos y datos de demostración. Queda guardada en este navegador
 * (IndexedDB), así los cambios sobreviven a una recarga.
 */
import { PGliteWorker } from '@electric-sql/pglite/worker'
import { Aplicacion, type Peticion } from './shims/express'
import { usarBase } from './shims/pg'

/** Cambia este nombre cuando cambien los scripts de `db/` para estrenar base. */
const NOMBRE_BASE = 'rvr-demo-v6-1'

const ZONA = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota'

// La API lee su configuración de process.env (en Node la carga dotenv); en la
// compilación de demostración `process.env` apunta a este objeto.
;(globalThis as unknown as { __rvrEnv: Record<string, string> }).__rvrEnv = {
  DATABASE_URL: 'pglite://demo',
  JWT_SECRET: 'modo-demostracion',
  SESION_HORAS: '12',
  TZ: ZONA,
  PORTAL_URL: location.origin,
}

// PGlite guarda en IndexedDB en segundo plano y, con una base recién creada,
// su sistema de archivos emite un ErrnoError inofensivo que no se captura.
for (const evento of ['error', 'unhandledrejection'] as const) {
  window.addEventListener(evento, (e) => {
    const causa = (e as ErrorEvent).error ?? (e as PromiseRejectionEvent).reason
    if ((causa as { name?: string } | undefined)?.name === 'ErrnoError') e.preventDefault()
  })
}

const CLAVE_REINICIO = 'rvr.demo.reiniciar'

async function iniciarBase(): Promise<PGliteWorker> {
  let reiniciar = false
  try {
    reiniciar = Boolean(localStorage.getItem(CLAVE_REINICIO))
    localStorage.removeItem(CLAVE_REINICIO)
  } catch {
    /* sin almacenamiento */
  }
  const db = new PGliteWorker(new Worker(new URL('./pglite.worker.ts', import.meta.url), { type: 'module' }), {
    meta: { zona: ZONA, nombre: NOMBRE_BASE, reiniciar },
  })
  await db.waitReady
  return db
}

let aplicacion: Promise<Aplicacion> | null = null

async function construir(): Promise<Aplicacion> {
  const base = iniciarBase()
  usarBase(base)

  const [{ config }, errores, auth, accesos, agenda, clientes, cotizaciones, disponibilidad, movil, notificaciones, ordenes, permisos, portal, roles, servicios, tablero, tecnicos, usuarios, ventas] =
    await Promise.all([
      import('../api/src/config'),
      import('../api/src/errores'),
      import('../api/src/auth/rutas'),
      import('../api/src/modulos/accesos'),
      import('../api/src/modulos/agenda'),
      import('../api/src/modulos/clientes'),
      import('../api/src/modulos/cotizaciones'),
      import('../api/src/modulos/disponibilidad'),
      import('../api/src/modulos/movil'),
      import('../api/src/modulos/notificaciones'),
      import('../api/src/modulos/ordenes'),
      import('../api/src/modulos/permisos'),
      import('../api/src/modulos/portal'),
      import('../api/src/modulos/roles'),
      import('../api/src/modulos/servicios'),
      import('../api/src/modulos/tablero'),
      import('../api/src/modulos/tecnicos'),
      import('../api/src/modulos/usuarios'),
      import('../api/src/modulos/ventas'),
    ])
  // En la demostración el enlace de recuperación se muestra en pantalla.
  ;(config as { produccion: boolean }).produccion = false

  const app = new Aplicacion()
  app.get('/api/salud', (_req, res) => {
    res.json({ ok: true, base: 'demostración', version: 'v6' })
  })
  app.use('/api/auth', auth.rutasAuth as never)
  app.use('/api/publico', servicios.rutasPublico as never)
  app.use('/api/roles', roles.rutasRoles as never)
  app.use('/api/permisos', permisos.rutasPermisos as never)
  app.use('/api/usuarios', usuarios.rutasUsuarios as never)
  app.use('/api/accesos', accesos.rutasAccesos as never)
  app.use('/api/servicios', servicios.rutasServicios as never)
  app.use('/api/tecnicos', tecnicos.rutasTecnicos as never)
  app.use('/api/disponibilidad', disponibilidad.rutasDisponibilidad as never)
  app.use('/api/clientes', clientes.rutasClientes as never)
  app.use('/api/cotizaciones', cotizaciones.rutasCotizaciones as never)
  app.use('/api/ordenes', ordenes.rutasOrdenes as never)
  app.use('/api/agenda', agenda.rutasAgenda as never)
  app.use('/api/ventas', ventas.rutasVentas as never)
  app.use('/api/abonos', ventas.rutasAbonos as never)
  app.use('/api/reportes', tablero.rutasReportes as never)
  app.use('/api/indicadores', tablero.rutasIndicadores as never)
  app.use('/api/estadisticas', tablero.rutasEstadisticas as never)
  app.use('/api/notificaciones', notificaciones.rutasNotificaciones as never)
  app.use('/api/busqueda', notificaciones.rutasBusqueda as never)
  app.use('/api/portal', portal.rutasPortal as never)
  app.use('/api/movil', movil.rutasMovil as never)
  app.alError(errores.manejadorDeErrores as never)

  await base
  return app
}

/** Arranca la base y la API (la primera vez tarda unos segundos). */
export function prepararDemo(): Promise<unknown> {
  aplicacion ??= construir()
  return aplicacion
}

export interface PeticionDemo {
  metodo: string
  url: URL
  cabeceras: Record<string, string>
  cuerpo?: unknown
}

/** Atiende una petición como lo haría la API por la red. */
export async function atender({ metodo, url, cabeceras, cuerpo }: PeticionDemo): Promise<{ estado: number; datos: unknown }> {
  const app = await (aplicacion ??= construir())
  const query: Record<string, string | string[]> = {}
  for (const clave of new Set(url.searchParams.keys())) {
    const valores = url.searchParams.getAll(clave)
    query[clave] = valores.length > 1 ? valores : valores[0]!
  }
  const headers: Record<string, string> = {}
  for (const [clave, valor] of Object.entries(cabeceras)) headers[clave.toLowerCase()] = valor
  const req: Peticion = {
    method: metodo,
    originalUrl: url.pathname + url.search,
    path: url.pathname,
    params: {},
    query,
    body: cuerpo === undefined ? {} : JSON.parse(JSON.stringify(cuerpo)),
    headers,
    socket: { remoteAddress: 'navegador (demo)' },
  }
  const res = await app.despachar(req)
  return { estado: res.estado, datos: res.cuerpo ?? null }
}

/**
 * Vuelve a los datos de demostración de fábrica: la base abierta no se puede
 * borrar mientras está en uso, así que se marca y se borra al recargar.
 */
export function reiniciarDemo() {
  try {
    localStorage.setItem(CLAVE_REINICIO, '1')
  } catch {
    /* sin almacenamiento, la base vive en memoria y la recarga ya la reinicia */
  }
  location.reload()
}
