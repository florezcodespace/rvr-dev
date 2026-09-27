import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { iso, listaBase, normalizar, pagina, rangoFechas, sinTildes } from '../comun.js'
import { consultar, unaFila } from '../db.js'
import { asincrono } from '../errores.js'

/**
 * Gestión de Acceso · HU_74 Consultar registro de accesos.
 * CA_74_04 · solo lectura: aquí no hay POST, PUT ni DELETE, y la base además
 * rechaza cualquier UPDATE o DELETE sobre la tabla (trigger fn_solo_lectura).
 */
export const rutasAccesos = Router()
rutasAccesos.use(sesion, permiso('accesos.consultar'))

const RESULTADOS = ['exitoso', 'fallido', 'bloqueado', 'cierre_sesion', 'recuperacion', 'restablecimiento'] as const

rutasAccesos.get(
  '/',
  asincrono(async (req, res) => {
    // CA_74_03 · filtro por usuario, rango de fechas o resultado
    const p = listaBase
      .merge(rangoFechas)
      .extend({
        resultado: z.enum(RESULTADOS).optional().catch(undefined),
        canal: z.enum(['web', 'movil']).optional().catch(undefined),
        usuario: z.coerce.number().int().positive().optional().catch(undefined),
      })
      .parse(req.query)

    const where = `
      WHERE ($1 = '' OR ${sinTildes(`a.identificador || ' ' || coalesce(u.nombres || ' ' || u.apellidos, '')`)} LIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR a.resultado = $2)
        AND ($3::text IS NULL OR a.canal = $3)
        AND ($4::date IS NULL OR a.fecha >= $4::date)
        AND ($5::date IS NULL OR a.fecha < $5::date + 1)
        AND ($6::int IS NULL OR a.usuario_id = $6)`
    const valores = [normalizar(p.q), p.resultado ?? null, p.canal ?? null, p.desde ?? null, p.hasta ?? null, p.usuario ?? null]

    const filas = await consultar<{
      id: number; usuario_id: number | null; identificador: string; resultado: string; canal: string
      ip: string | null; fecha: Date; nombre: string | null; rol: string | null; total: number
    }>(
      `SELECT a.id, a.usuario_id, a.identificador, a.resultado, a.canal, a.ip, a.fecha,
              trim(u.nombres || ' ' || u.apellidos) AS nombre, r.nombre AS rol,
              count(*) OVER ()::int AS total
         FROM registro_acceso a
         LEFT JOIN usuario u ON u.id = a.usuario_id
         LEFT JOIN rol r     ON r.id = u.rol_id
         ${where}
        ORDER BY a.fecha DESC, a.id DESC
        LIMIT $7 OFFSET $8`,
      [...valores, p.porPagina, (p.pagina - 1) * p.porPagina],
    )

    const resumen = await unaFila<Record<string, number>>(
      `SELECT count(*) FILTER (WHERE resultado = 'exitoso')::int   AS exitosos,
              count(*) FILTER (WHERE resultado = 'fallido')::int   AS fallidos,
              count(*) FILTER (WHERE resultado = 'bloqueado')::int AS bloqueos
         FROM registro_acceso WHERE fecha > now() - interval '7 days'`,
    )

    res.json({
      ...pagina(
        filas.map((f) => ({
          id: f.id,
          usuarioId: f.usuario_id,
          identificador: f.identificador,
          nombre: f.nombre,
          rol: f.rol,
          resultado: f.resultado,
          canal: f.canal,
          ip: f.ip ?? '',
          fecha: iso(f.fecha),
        })),
        filas[0]?.total ?? 0,
        p.pagina,
        p.porPagina,
      ),
      resumen7Dias: resumen,
    })
  }),
)
