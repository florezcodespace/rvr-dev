import pg from 'pg'
import { config } from './config.js'

/**
 * `numeric` llega como texto desde PostgreSQL porque no cabe en un `number` de
 * JavaScript sin perder precisión. Aquí sí cabe —son pesos, con dos decimales y
 * millones como máximo— y el portal espera números, así que se convierte una
 * sola vez, en el driver, en vez de en cada consulta.
 */
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor) => Number(valor))
pg.types.setTypeParser(pg.types.builtins.INT8, (valor) => Number(valor))
// `date` como texto YYYY-MM-DD: convertirlo a Date lo corre un día en Colombia.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor)

/**
 * La base guarda `timestamp` sin zona. La sesión de PostgreSQL usa la misma
 * zona horaria que la API, así `now()`, las franjas de disponibilidad y las
 * fechas que llegan a JavaScript hablan de la misma hora.
 */
const ZONA = (process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota').replace(/[^A-Za-z0-9_/+-]/g, '')

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  options: `-c TimeZone=${ZONA}`,
  // Neon y Supabase exigen TLS; en local no hay certificado que validar.
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(config.databaseUrl)
    ? undefined
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
})

/**
 * Una conexión inactiva que la base corta (reinicio de PostgreSQL, montar-base
 * que recrea la base) no debe tumbar la API: el pool la descarta y abre otra.
 */
pool.on('error', (error) => {
  console.error(`[db] conexión inactiva cerrada por la base: ${error.message}`)
})

export type Conexion = pg.Pool | pg.PoolClient

export async function consultar<T extends pg.QueryResultRow>(
  sql: string,
  valores: unknown[] = [],
  conexion: Conexion = pool,
): Promise<T[]> {
  const { rows } = await conexion.query<T>(sql, valores)
  return rows
}

/** Primera fila, o `null`. Evita el `rows[0]` suelto en cada módulo. */
export async function unaFila<T extends pg.QueryResultRow>(
  sql: string,
  valores: unknown[] = [],
  conexion: Conexion = pool,
): Promise<T | null> {
  const filas = await consultar<T>(sql, valores, conexion)
  return filas[0] ?? null
}

/**
 * Ejecuta varias sentencias en una transacción y revierte si alguna falla
 * (RNF-005: ante un error no queda nada a medias).
 *
 * `usuarioId` y `motivo` llegan a los triggers como variables de sesión: así
 * el historial de la orden sabe quién cambió el estado y por qué.
 */
export async function enTransaccion<T>(
  tarea: (cliente: pg.PoolClient) => Promise<T>,
  contexto: { usuarioId?: number; motivo?: string } = {},
): Promise<T> {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    if (contexto.usuarioId) {
      await cliente.query(`SELECT set_config('rvr.usuario_id', $1, true)`, [String(contexto.usuarioId)])
    }
    if (contexto.motivo) {
      await cliente.query(`SELECT set_config('rvr.motivo', $1, true)`, [contexto.motivo])
    }
    const resultado = await tarea(cliente)
    await cliente.query('COMMIT')
    return resultado
  } catch (error) {
    await cliente.query('ROLLBACK')
    throw error
  } finally {
    cliente.release()
  }
}

/** Cambia el motivo que el trigger del historial escribe, dentro de una transacción. */
export async function motivo(cliente: pg.PoolClient, texto: string) {
  await cliente.query(`SELECT set_config('rvr.motivo', $1, true)`, [texto])
}
