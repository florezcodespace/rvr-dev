import { Router } from 'express'
import { z } from 'zod'
import { permiso, sesion } from '../auth/middleware.js'
import { filtroOpcional, idRuta, listaBase, normalizar, pagina, sinTildes, textoOpcional, textoRequerido } from '../comun.js'
import { consultar, unaFila } from '../db.js'
import { asincrono, conflicto, noEncontrado } from '../errores.js'

/** CA_15_03 · Listado de categorías definido para el catálogo (mismo CHECK de la base). */
export const CATEGORIAS = ['Mantenimiento', 'Servidores', 'Redes', 'Cámaras de seguridad', 'Alarmas'] as const

interface FilaServicio {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  estado: string
  categoria: string
}

const aServicio = (f: FilaServicio) => ({
  id: f.id,
  nombre: f.nombre,
  descripcion: f.descripcion ?? '',
  precioBase: f.precio_base,
  estado: f.estado,
  categoria: f.categoria,
})

/** Servicios · Catálogo de Servicios (HU_15 – HU_20). */
export const rutasServicios = Router()
rutasServicios.use(sesion)

rutasServicios.get(
  '/categorias',
  asincrono(async (_req, res) => {
    res.json(CATEGORIAS)
  }),
)

/** HU_17 listar · HU_16 buscar por nombre, categoría o estado */
rutasServicios.get(
  '/',
  permiso('servicios.listar', 'servicios.buscar', 'cotizaciones.registrar', 'cotizaciones.editar'),
  asincrono(async (req, res) => {
    const p = listaBase
      .extend({
        estado: filtroOpcional(['activo', 'inactivo'] as const),
        categoria: z.enum(CATEGORIAS).optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaServicio & { total: number; veces: number }>(
      `SELECT s.*, count(*) OVER ()::int AS total,
              (SELECT coalesce(sum(dc.cantidad), 0) FROM detalle_cotizacion dc WHERE dc.servicio_id = s.id)::int AS veces
         FROM servicio s
        WHERE ($1 = '' OR ${sinTildes(`s.nombre || ' ' || s.categoria || ' ' || coalesce(s.descripcion, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR s.estado = $2)
          AND ($3::text IS NULL OR s.categoria = $3)
        ORDER BY s.categoria, s.nombre
        LIMIT $4 OFFSET $5`,
      [normalizar(p.q), p.estado ?? null, p.categoria ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
    )
    const conteos = await unaFila<Record<string, number>>(
      `SELECT count(*)::int AS todos,
              count(*) FILTER (WHERE estado = 'activo')::int AS activo,
              count(*) FILTER (WHERE estado = 'inactivo')::int AS inactivo
         FROM servicio`,
    )
    res.json({
      ...pagina(filas.map((f) => ({ ...aServicio(f), vecesCotizado: f.veces })), filas[0]?.total ?? 0, p.pagina, p.porPagina),
      conteos,
    })
  }),
)

async function detalle(id: number) {
  const fila = await unaFila<FilaServicio>(`SELECT * FROM servicio WHERE id = $1`, [id])
  if (!fila) throw noEncontrado('ese servicio')
  const uso = await unaFila<{ cotizaciones: number; unidades: number; ordenes: number; ingresos: number }>(
    `SELECT count(DISTINCT dc.cotizacion_id)::int AS cotizaciones,
            coalesce(sum(dc.cantidad), 0)::int    AS unidades,
            count(DISTINCT d.orden_id)::int       AS ordenes,
            coalesce(sum(dc.subtotal) FILTER (WHERE d.id IS NOT NULL), 0) AS ingresos
       FROM detalle_cotizacion dc
       LEFT JOIN detalle_orden d ON d.detalle_cotizacion_id = dc.id
      WHERE dc.servicio_id = $1`,
    [id],
  )
  return { ...aServicio(fila), uso }
}

/** HU_20 · Ver detalle */
rutasServicios.get(
  '/:id',
  permiso('servicios.ver_detalle', 'servicios.editar'),
  asincrono(async (req, res) => {
    res.json(await detalle(idRuta.parse(req.params.id)))
  }),
)

const datosServicio = z.object({
  nombre: textoRequerido(100, 'El nombre del servicio'),
  descripcion: textoOpcional(2000),
  categoria: z.enum(CATEGORIAS, { error: 'Selecciona una categoría del listado' }),
  // CA_15_04 · numérico y mayor que cero
  precioBase: z.coerce
    .number({ error: 'El precio base debe ser un número' })
    .positive('El precio base debe ser mayor que cero')
    .max(99_999_999, 'El precio base es demasiado alto'),
})

async function nombreLibre(nombre: string, excepto = 0) {
  if (await unaFila(`SELECT 1 FROM servicio WHERE lower(nombre) = lower($1) AND id <> $2`, [nombre, excepto])) {
    throw conflicto('NOMBRE_DUPLICADO', 'Ya existe un servicio con ese nombre.')
  }
}

/** HU_15 · Registrar */
rutasServicios.post(
  '/',
  permiso('servicios.registrar'),
  asincrono(async (req, res) => {
    const d = datosServicio.parse(req.body)
    await nombreLibre(d.nombre)
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO servicio (nombre, descripcion, precio_base, categoria, estado)
       VALUES ($1, $2, $3, $4, 'activo') RETURNING id`,
      [d.nombre, d.descripcion, d.precioBase, d.categoria],
    )
    res.status(201).json(await detalle(fila!.id))
  }),
)

/**
 * HU_18 · Editar. CA_18_03: el precio nuevo no toca las cotizaciones ya
 * registradas, porque cada ítem guarda su propio precio_unitario.
 */
rutasServicios.put(
  '/:id',
  permiso('servicios.editar'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const d = datosServicio.parse(req.body)
    await detalle(id)
    await nombreLibre(d.nombre, id)
    await consultar(
      `UPDATE servicio SET nombre = $2, descripcion = $3, precio_base = $4, categoria = $5 WHERE id = $1`,
      [id, d.nombre, d.descripcion, d.precioBase, d.categoria],
    )
    res.json(await detalle(id))
  }),
)

/** HU_19 · Cambiar estado (CA_19_03: no se eliminan) */
rutasServicios.patch(
  '/:id/estado',
  permiso('servicios.cambiar_estado'),
  asincrono(async (req, res) => {
    const id = idRuta.parse(req.params.id)
    const { estado } = z.object({ estado: z.enum(['activo', 'inactivo']) }).parse(req.body)
    await detalle(id)
    await consultar(`UPDATE servicio SET estado = $2 WHERE id = $1`, [id, estado])
    res.json(await detalle(id))
  }),
)

/**
 * HU_21 · Catálogo público: sin sesión (CA_21_01), solo servicios activos
 * (CA_19_02), con búsqueda y filtro por categoría (CA_21_03).
 */
export const rutasPublico = Router()

rutasPublico.get(
  '/servicios',
  asincrono(async (req, res) => {
    const p = z
      .object({
        q: z.string().trim().max(100).default(''),
        categoria: z.enum(CATEGORIAS).optional().catch(undefined),
      })
      .parse(req.query)
    const filas = await consultar<FilaServicio>(
      `SELECT id, nombre, descripcion, precio_base, estado, categoria FROM servicio
        WHERE estado = 'activo'
          AND ($1 = '' OR ${sinTildes(`nombre || ' ' || categoria || ' ' || coalesce(descripcion, '')`)} LIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR categoria = $2)
        ORDER BY array_position(ARRAY['Mantenimiento','Servidores','Redes','Cámaras de seguridad','Alarmas']::varchar[], categoria), nombre`,
      [normalizar(p.q), p.categoria ?? null],
    )
    res.json({ categorias: CATEGORIAS, items: filas.map(aServicio) })
  }),
)
