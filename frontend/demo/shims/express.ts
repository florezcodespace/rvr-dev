/**
 * `express` del modo demostración: el mismo `Router` (get, post, put, patch,
 * delete y use) con `req`/`res` equivalentes, suficiente para que los módulos
 * de la API corran sin cambios dentro del navegador.
 */

export type Siguiente = (error?: unknown) => void
export type Manejador = (req: Peticion, res: Respuesta, next: Siguiente) => unknown
type ManejadorError = (error: unknown, req: Peticion, res: Respuesta, next: Siguiente) => unknown

export interface Peticion {
  method: string
  originalUrl: string
  path: string
  params: Record<string, string>
  query: Record<string, string | string[]>
  body: unknown
  headers: Record<string, string | undefined>
  socket: { remoteAddress: string }
  [clave: string]: unknown
}

export class Respuesta {
  estado = 200
  cuerpo: unknown = undefined
  terminada = false
  private alTerminar: () => void = () => undefined
  readonly fin: Promise<void>

  constructor() {
    this.fin = new Promise((resolver) => {
      this.alTerminar = resolver
    })
  }

  status(codigo: number) {
    this.estado = codigo
    return this
  }

  json(datos: unknown) {
    // Igual que por la red: las fechas salen como texto ISO y lo demás se copia.
    this.cuerpo = datos === undefined ? null : JSON.parse(JSON.stringify(datos))
    this.terminar()
    return this
  }

  end() {
    this.terminar()
    return this
  }

  private terminar() {
    if (this.terminada) return
    this.terminada = true
    this.alTerminar()
  }
}

interface Capa {
  metodo: string | null
  patron: RegExp
  claves: string[]
  manejadores: (Manejador | Enrutador)[]
  prefijo: boolean
}

function compilar(ruta: string, prefijo: boolean) {
  const claves: string[] = []
  const limpio = ruta === '/' ? '' : ruta.replace(/\/$/, '')
  const cuerpo = limpio.replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === ':' ? c : `\\${c}`)).replace(/:(\w+)/g, (_m, clave: string) => {
    claves.push(clave)
    return '([^/]+)'
  })
  const patron = new RegExp(prefijo ? `^${cuerpo}(?=/|$)` : `^${cuerpo}/?$`)
  return { patron, claves }
}

export class Enrutador {
  readonly capas: Capa[] = []

  private agregar(metodo: string | null, ruta: string, manejadores: (Manejador | Enrutador)[], prefijo: boolean) {
    const { patron, claves } = compilar(ruta, prefijo)
    this.capas.push({ metodo, patron, claves, manejadores, prefijo })
    return this
  }

  get(ruta: string, ...m: Manejador[]) { return this.agregar('GET', ruta, m, false) }
  post(ruta: string, ...m: Manejador[]) { return this.agregar('POST', ruta, m, false) }
  put(ruta: string, ...m: Manejador[]) { return this.agregar('PUT', ruta, m, false) }
  patch(ruta: string, ...m: Manejador[]) { return this.agregar('PATCH', ruta, m, false) }
  delete(ruta: string, ...m: Manejador[]) { return this.agregar('DELETE', ruta, m, false) }

  use(primero: string | Manejador | Enrutador, ...resto: (Manejador | Enrutador)[]) {
    if (typeof primero === 'string') return this.agregar(null, primero, resto, true)
    return this.agregar(null, '', [primero, ...resto], true)
  }

  /**
   * Recorre las capas en orden, como Express: cada manejador decide si responde
   * o llama a `next()`. Devuelve `false` si ninguna ruta atendió la petición.
   */
  async atender(req: Peticion, res: Respuesta, ruta: string): Promise<boolean | { error: unknown }> {
    for (const capa of this.capas) {
      if (capa.metodo && capa.metodo !== req.method) continue
      const encontrado = capa.patron.exec(ruta)
      if (!encontrado) continue
      capa.claves.forEach((clave, i) => {
        req.params[clave] = decodeURIComponent(encontrado[i + 1]!)
      })
      const resto = capa.prefijo ? ruta.slice(encontrado[0].length) || '/' : ruta

      for (const manejador of capa.manejadores) {
        if (manejador instanceof Enrutador) {
          const r = await manejador.atender(req, res, resto)
          if (r !== false) return r
          continue
        }
        const resultado = await ejecutar(manejador, req, res)
        if (resultado.error !== undefined) return { error: resultado.error }
        if (!resultado.siguiente) return true
      }
    }
    return false
  }
}

/**
 * Llama a un manejador y espera a que responda o pase al siguiente. Los
 * manejadores de la API no devuelven la promesa (`asincrono` la encadena a
 * `next`), así que se espera por la respuesta o por `next`, lo que llegue.
 */
function ejecutar(manejador: Manejador, req: Peticion, res: Respuesta): Promise<{ siguiente: boolean; error?: unknown }> {
  return new Promise((resolver) => {
    let hecho = false
    const listo = (valor: { siguiente: boolean; error?: unknown }) => {
      if (hecho) return
      hecho = true
      resolver(valor)
    }
    void res.fin.then(() => listo({ siguiente: false }))
    try {
      const devuelto = manejador(req, res, (error?: unknown) => listo(error === undefined ? { siguiente: true } : { siguiente: false, error }))
      if (devuelto instanceof Promise) devuelto.catch((error: unknown) => listo({ siguiente: false, error }))
    } catch (error) {
      listo({ siguiente: false, error })
    }
  })
}

export function Router() {
  return new Enrutador()
}

/** Composición de la aplicación: montajes y manejador de errores. */
export class Aplicacion extends Enrutador {
  private manejadorError: ManejadorError | null = null

  alError(manejador: ManejadorError) {
    this.manejadorError = manejador
  }

  async despachar(req: Peticion): Promise<Respuesta> {
    const res = new Respuesta()
    const r = await this.atender(req, res, req.path)
    if (r === false && !res.terminada) {
      res.status(404).json({ codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'Esa ruta no existe.' })
    } else if (typeof r === 'object' && this.manejadorError) {
      await ejecutar((rq, rs, nx) => this.manejadorError!(r.error, rq, rs, nx), req, res)
    }
    if (!res.terminada) await res.fin
    return res
  }
}

const express = Object.assign(() => new Aplicacion(), { Router, json: () => ((_q: Peticion, _r: Respuesta, n: Siguiente) => n()) })
export default express
export type Request = Peticion
export type Response = Respuesta
export type NextFunction = Siguiente
