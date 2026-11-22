import { z } from 'zod'
import { consultar, unaFila } from '../db.js'
import { filtroOpcional, listaBase, normalizar, pagina, sinTildes, textoOpcional, textoRequerido } from '../utils/comun.js'
import { conflicto, noEncontrado } from '../utils/errores.js'

/** Servicios · Catálogo de Servicios (HU_15 – HU_21). */

/** CA_15_03 · Listado de categorías definido para el catálogo (mismo CHECK de la base). */
export const CATEGORIAS = ['Mantenimiento', 'Servidores', 'Redes', 'Cámaras de seguridad', 'Alarmas'] as const

interface FilaServicio {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  estado: string
  categoria: string
  duracion_estimada_min: number
  dias_garantia: number
}

const aServicio = (f: FilaServicio) => ({
  id: f.id,
  nombre: f.nombre,
  descripcion: f.descripcion ?? '',
  precioBase: f.precio_base,
  estado: f.estado,
  categoria: f.categoria,
  duracionMin: f.duracion_estimada_min,
  diasGarantia: f.dias_garantia,
})

export const filtroServicios = listaBase.extend({
  estado: filtroOpcional(['activo', 'inactivo'] as const),
  categoria: z.enum(CATEGORIAS).optional().catch(undefined),
})

/** HU_17 listar · HU_16 buscar por nombre, categoría o estado */
export async function listar(p: z.infer<typeof filtroServicios>) {
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
  return {
    ...pagina(filas.map((f) => ({ ...aServicio(f), vecesCotizado: f.veces })), filas[0]?.total ?? 0, p.pagina, p.porPagina),
    conteos,
  }
}

/** HU_20 · Ver detalle, con el uso del servicio. */
export async function detalle(id: number) {
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

export const datosServicio = z.object({
  nombre: textoRequerido(100, 'El nombre del servicio'),
  descripcion: textoOpcional(2000),
  categoria: z.enum(CATEGORIAS, { error: 'Selecciona una categoría del listado' }),
  // CA_15_04 · numérico y mayor que cero
  precioBase: z.coerce
    .number({ error: 'El precio base debe ser un número' })
    .positive('El precio base debe ser mayor que cero')
    .max(99_999_999, 'El precio base es demasiado alto'),
  // [Feedback 9] Tiempo estimado en minutos (15 min a 80 h)
  duracionMin: z.coerce
    .number({ error: 'El tiempo estimado debe ser un número' })
    .int('El tiempo estimado va en minutos enteros')
    .min(15, 'El tiempo estimado mínimo es de 15 minutos')
    .max(4800, 'El tiempo estimado máximo es de 80 horas')
    .default(60),
  // [Feedback 13] Días de garantía (0 = sin garantía)
  diasGarantia: z.coerce
    .number({ error: 'Los días de garantía deben ser un número' })
    .int()
    .min(0, 'Los días de garantía no pueden ser negativos')
    .max(1095, 'Máximo 3 años de garantía')
    .default(30),
})
type DatosServicio = z.infer<typeof datosServicio>

async function nombreLibre(nombre: string, excepto = 0) {
  if (await unaFila(`SELECT 1 FROM servicio WHERE lower(nombre) = lower($1) AND id <> $2`, [nombre, excepto])) {
    throw conflicto('NOMBRE_DUPLICADO', 'Ya existe un servicio con ese nombre.')
  }
}

/** HU_15 · Registrar */
export async function registrar(d: DatosServicio) {
  await nombreLibre(d.nombre)
  const fila = await unaFila<{ id: number }>(
    `INSERT INTO servicio (nombre, descripcion, precio_base, categoria, duracion_estimada_min, dias_garantia, estado)
     VALUES ($1, $2, $3, $4, $5, $6, 'activo') RETURNING id`,
    [d.nombre, d.descripcion, d.precioBase, d.categoria, d.duracionMin, d.diasGarantia],
  )
  return detalle(fila!.id)
}

/**
 * HU_18 · Editar. CA_18_03: el precio nuevo no toca las cotizaciones ya
 * registradas, porque cada ítem guarda su propio precio_unitario.
 */
export async function editar(id: number, d: DatosServicio) {
  await detalle(id)
  await nombreLibre(d.nombre, id)
  await consultar(
    `UPDATE servicio SET nombre = $2, descripcion = $3, precio_base = $4, categoria = $5,
            duracion_estimada_min = $6, dias_garantia = $7 WHERE id = $1`,
    [id, d.nombre, d.descripcion, d.precioBase, d.categoria, d.duracionMin, d.diasGarantia],
  )
  return detalle(id)
}

export const datosEstado = z.object({ estado: z.enum(['activo', 'inactivo']) })

/** HU_19 · Cambiar estado (CA_19_03: no se eliminan) */
export async function cambiarEstado(id: number, estado: 'activo' | 'inactivo') {
  await detalle(id)
  await consultar(`UPDATE servicio SET estado = $2 WHERE id = $1`, [id, estado])
  return detalle(id)
}

export const filtroPublico = z.object({
  q: z.string().trim().max(100).default(''),
  categoria: z.enum(CATEGORIAS).optional().catch(undefined),
})

/**
 * HU_21 · Catálogo público: sin sesión (CA_21_01), solo servicios activos
 * (CA_19_02), con búsqueda y filtro por categoría (CA_21_03).
 */
export async function catalogoPublico(p: z.infer<typeof filtroPublico>) {
  const filas = await consultar<FilaServicio>(
    `SELECT id, nombre, descripcion, precio_base, estado, categoria, duracion_estimada_min, dias_garantia FROM servicio
      WHERE estado = 'activo'
        AND ($1 = '' OR ${sinTildes(`nombre || ' ' || categoria || ' ' || coalesce(descripcion, '')`)} LIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR categoria = $2)
      ORDER BY array_position(ARRAY['Mantenimiento','Servidores','Redes','Cámaras de seguridad','Alarmas']::varchar[], categoria), nombre`,
    [normalizar(p.q), p.categoria ?? null],
  )
  return { categorias: CATEGORIAS, items: filas.map(aServicio) }
}
