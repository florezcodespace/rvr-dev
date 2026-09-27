import { STORAGE_KEYS, storage } from './storage'

/**
 * Cliente HTTP del portal. Todo pasa por la API (`VITE_API_URL`), que es la
 * única que habla con PostgreSQL.
 */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api').replace(/\/$/, '')

/**
 * Modo demostración (la versión publicada en Vercel): la misma API corre dentro
 * del navegador sobre PGlite, con los datos de demostración. Ver `demo/`.
 */
export const MODO_DEMO = import.meta.env.VITE_DEMO === '1'
const BASE_URL = MODO_DEMO ? `${location.origin}/api` : API_URL

/** Respuesta de la API, venga de la red o del modo demostración. */
interface Llegada {
  estado: number
  texto: string
}

async function enviar(url: URL, metodo: string, cabeceras: Record<string, string>, cuerpo: unknown): Promise<Llegada> {
  if (MODO_DEMO) {
    const { atender } = await import('virtual:rvr-demo')
    const r = await atender({ metodo, url, cabeceras, cuerpo })
    return { estado: r.estado, texto: r.datos === null || r.estado === 204 ? '' : JSON.stringify(r.datos) }
  }
  const respuesta = await fetch(url, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  return { estado: respuesta.status, texto: respuesta.status === 204 ? '' : await respuesta.text() }
}

/**
 * Error de la API con el código de negocio que devuelve el backend.
 *
 * Los campos se declaran y se asignan a mano en vez de usar propiedades de
 * parámetro: el proyecto compila con `erasableSyntaxOnly`, que las prohíbe.
 */
export class ErrorApi extends Error {
  readonly estado: number
  readonly codigo: string
  readonly extra: Record<string, unknown>

  constructor(estado: number, codigo: string, mensaje: string, extra: Record<string, unknown> = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.codigo = codigo
    this.extra = extra
  }

  /** Detalle por campo de una validación (422 DATOS_INVALIDOS). */
  get campos(): Record<string, string> {
    const detalles = this.extra.detalles
    if (!Array.isArray(detalles)) return {}
    const salida: Record<string, string> = {}
    for (const d of detalles as { campo: string; mensaje: string }[]) {
      const clave = d.campo.split('.')[0] ?? d.campo
      if (clave && !salida[clave]) salida[clave] = d.mensaje
    }
    return salida
  }
}

interface SesionGuardada {
  token?: string
}

function token(): string | null {
  return storage.get<SesionGuardada | null>(STORAGE_KEYS.session, null)?.token ?? null
}

/** Evento global: la sesión dejó de valer (el servidor respondió 401). */
export const EVENTO_SESION_CADUCADA = 'rvr:sesion-caducada'

type Params = Record<string, string | number | boolean | undefined | null>

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  cuerpo?: unknown
  /** Parámetros de consulta; los `undefined`, `null` y cadenas vacías se descartan. */
  params?: Params
  /** Login, registro, recuperación y catálogo público no llevan token. */
  sinSesion?: boolean
}

export async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${ruta}`)
  for (const [clave, valor] of Object.entries(opciones.params ?? {})) {
    if (valor === undefined || valor === null || valor === '') continue
    url.searchParams.set(clave, String(valor))
  }

  const cabeceras: Record<string, string> = {}
  if (opciones.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  const jwt = opciones.sinSesion ? null : token()
  if (jwt) cabeceras.Authorization = `Bearer ${jwt}`

  let respuesta: Llegada
  try {
    respuesta = await enviar(url, opciones.metodo ?? 'GET', cabeceras, opciones.cuerpo)
  } catch (error) {
    if (MODO_DEMO) {
      console.error('[demo]', error)
      throw new ErrorApi(0, 'ERROR_DEMO', 'La base de demostración no pudo responder. Recarga la página.')
    }
    // Servidor apagado, sin red o CORS: para la vista es el mismo problema.
    throw new ErrorApi(0, 'ERROR_RED', 'No pudimos conectarnos con el servidor. Revisa que la API esté encendida.')
  }

  if (respuesta.estado === 204) return undefined as T

  let datos: unknown = null
  try {
    datos = respuesta.texto ? JSON.parse(respuesta.texto) : null
  } catch {
    datos = null
  }

  if (respuesta.estado < 200 || respuesta.estado >= 300) {
    const cuerpo = (datos ?? {}) as Record<string, unknown>
    // Con token y 401, la sesión se cerró en el servidor (contraseña
    // restablecida, cuenta inactivada, cierre en el móvil…).
    if (respuesta.estado === 401 && jwt) {
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_CADUCADA, { detail: cuerpo.mensaje }))
    }
    throw new ErrorApi(
      respuesta.estado,
      typeof cuerpo.codigo === 'string' ? cuerpo.codigo : 'ERROR_DESCONOCIDO',
      typeof cuerpo.mensaje === 'string' ? cuerpo.mensaje : 'La petición falló.',
      cuerpo,
    )
  }

  return datos as T
}

/** Atajos por verbo. */
export const api = {
  get: <T>(ruta: string, params?: Params) => pedir<T>(ruta, { params }),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>(ruta, { metodo: 'POST', cuerpo: cuerpo ?? {} }),
  put: <T>(ruta: string, cuerpo: unknown) => pedir<T>(ruta, { metodo: 'PUT', cuerpo }),
  patch: <T>(ruta: string, cuerpo: unknown) => pedir<T>(ruta, { metodo: 'PATCH', cuerpo }),
}

/** Mensaje legible de cualquier error. */
export const mensajeDe = (error: unknown, porDefecto = 'Algo salió mal. Inténtalo de nuevo.') =>
  error instanceof Error && error.message ? error.message : porDefecto

/** Página común que devuelven los listados de la API. */
export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

export type Conteos = Record<string, number>
