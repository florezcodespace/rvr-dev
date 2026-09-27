/** Lo que se necesita de PGlite (o de PGliteWorker, que se usa en la demo). */
interface Base {
  query<T>(sql: string, valores?: unknown[], opciones?: object): Promise<{ rows: T[]; affectedRows?: number }>
}

const dos = (n: number) => String(n).padStart(2, '0')

/** `timestamp` sin zona = hora local, como lo trata `pg` en Node. */
function aTextoLocal(fecha: Date) {
  const minutos = -fecha.getTimezoneOffset()
  const abs = Math.abs(minutos)
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ` +
    `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}.${String(fecha.getMilliseconds()).padStart(3, '0')}` +
    `${minutos >= 0 ? '+' : '-'}${dos(Math.floor(abs / 60))}:${dos(abs % 60)}`
  )
}
const serializarFecha = (valor: unknown) => (valor instanceof Date ? aTextoLocal(valor) : String(valor))

/** Los mismos conversores que configura `api/src/db.ts` sobre `pg`. */
const OPCIONES = {
  parsers: {
    1700: (v: string) => Number(v), // numeric → number
    20: (v: string) => Number(v), // int8 → number
    1082: (v: string) => v, // date como texto YYYY-MM-DD
    1114: (v: string) => new Date(v.replace(' ', 'T')), // timestamp sin zona = hora local
  },
  serializers: {
    1114: serializarFecha,
    1184: serializarFecha,
    1082: (v: unknown) => (v instanceof Date ? aTextoLocal(v).slice(0, 10) : String(v)),
  },
}

/**
 * `pg` del modo demostración sobre PGlite (PostgreSQL compilado a WebAssembly).
 * Expone lo que usa `api/src/db.ts`: `Pool` con `query`, `connect` y `on`, y
 * `types.setTypeParser` (los conversores se configuran al crear PGlite).
 */

let base: Promise<Base> | null = null

/** Lo llama el servidor de demostración cuando la base está lista. */
export function usarBase(promesa: Promise<Base>) {
  base = promesa
}

function obtener(): Promise<Base> {
  if (!base) throw new Error('La base de demostración no se ha iniciado.')
  return base
}

interface Resultado<T> {
  rows: T[]
  rowCount: number
}

async function consultar<T>(sql: string, valores: unknown[] = []): Promise<Resultado<T>> {
  const db = await obtener()
  const r = await db.query<T>(sql, valores, OPCIONES)
  return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length }
}

/**
 * Una sola conexión de verdad: las transacciones se turnan para que un BEGIN
 * de una petición no se mezcle con el de otra. Las consultas sueltas no
 * esperan turno (así una consulta sin cliente dentro de una transacción no se
 * bloquea a sí misma).
 */
let turno: Promise<void> = Promise.resolve()

class Cliente {
  private soltar: () => void
  constructor(soltar: () => void) {
    this.soltar = soltar
  }
  query<T>(sql: string, valores?: unknown[]) {
    return consultar<T>(sql, valores)
  }
  release() {
    this.soltar()
  }
}

class Pool {
  constructor(_opciones?: unknown) {}
  on() {
    return this
  }
  query<T>(sql: string, valores?: unknown[]) {
    return consultar<T>(sql, valores)
  }
  async connect() {
    let soltar!: () => void
    const anterior = turno
    turno = new Promise<void>((resolver) => {
      soltar = resolver
    })
    await anterior
    return new Cliente(soltar)
  }
  async end() {}
}

const types = {
  builtins: { NUMERIC: 1700, INT8: 20, DATE: 1082, TIMESTAMP: 1114, TIMESTAMPTZ: 1184 },
  setTypeParser: () => undefined,
}

export { Pool, types }
export default { Pool, types }
