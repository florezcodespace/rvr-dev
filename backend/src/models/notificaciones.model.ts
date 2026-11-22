import { z } from 'zod'
import { consultar, unaFila } from '../db.js'
import { iso, normalizar, numeroCotizacion, sinTildes } from '../utils/comun.js'

/** Campana de avisos: cada cuenta ve solo los suyos. */
export async function listar(usuarioId: number) {
  const filas = await consultar<{ id: number; titulo: string; mensaje: string; enlace: string | null; leida: boolean; fecha: Date }>(
    `SELECT id, titulo, mensaje, enlace, leida, fecha FROM notificacion
      WHERE usuario_id = $1 ORDER BY fecha DESC, id DESC LIMIT 40`,
    [usuarioId],
  )
  const noLeidas = await unaFila<{ n: number }>(
    `SELECT count(*)::int AS n FROM notificacion WHERE usuario_id = $1 AND NOT leida`, [usuarioId])
  return {
    noLeidas: noLeidas?.n ?? 0,
    items: filas.map((f) => ({ ...f, enlace: f.enlace ?? null, fecha: iso(f.fecha) })),
  }
}

export async function marcarLeida(id: number, usuarioId: number) {
  await consultar(`UPDATE notificacion SET leida = true WHERE id = $1 AND usuario_id = $2`, [id, usuarioId])
}

export async function leerTodas(usuarioId: number) {
  await consultar(`UPDATE notificacion SET leida = true WHERE usuario_id = $1 AND NOT leida`, [usuarioId])
}

export const filtroBusqueda = z.object({ q: z.string().trim().max(80).default('') })

/** Buscador global del portal administrativo (⌘K). Solo lo que el rol puede ver. */
export async function buscar(q: string, permisos: Set<string>) {
  const tiene = (clave: string) => permisos.has(clave)
  const texto = normalizar(q)
  if (texto.length < 2) return []
  const numero = Number(q.replace(/\D/g, '')) || 0
  const resultados: { tipo: string; id: number; titulo: string; detalle: string; enlace: string }[] = []

  if (tiene('ordenes.listar') || tiene('ordenes.buscar')) {
    const filas = await consultar<{ id: number; codigo_orden: string; estado: string; cliente: string | null }>(
      `SELECT o.id, o.codigo_orden, o.estado, trim(c.nombres || ' ' || c.apellidos) AS cliente
         FROM orden o LEFT JOIN v_orden_cliente oc ON oc.orden_id = o.id LEFT JOIN cliente c ON c.id = oc.cliente_id
        WHERE ${sinTildes(`o.codigo_orden || ' ' || coalesce(c.nombres || ' ' || c.apellidos, '')`)} LIKE '%' || $1 || '%'
        ORDER BY o.fecha_creacion DESC LIMIT 5`, [texto])
    resultados.push(...filas.map((f) => ({
      tipo: 'Orden', id: f.id, titulo: f.codigo_orden, detalle: `${f.cliente ?? ''} · ${f.estado.replace(/_/g, ' ')}`, enlace: `/ordenes/${f.id}`,
    })))
  }
  if (tiene('cotizaciones.listar') || tiene('cotizaciones.buscar')) {
    const filas = await consultar<{ id: number; estado: string; cliente: string }>(
      `SELECT q.id, q.estado, trim(c.nombres || ' ' || c.apellidos) AS cliente FROM cotizacion q JOIN cliente c ON c.id = q.cliente_id
        WHERE q.id = $2 OR ${sinTildes(`c.nombres || ' ' || c.apellidos`)} LIKE '%' || $1 || '%'
        ORDER BY q.fecha_cotizacion DESC LIMIT 5`, [texto, numero])
    resultados.push(...filas.map((f) => ({
      tipo: 'Cotización', id: f.id, titulo: numeroCotizacion(f.id), detalle: `${f.cliente} · ${f.estado}`, enlace: `/cotizaciones/${f.id}`,
    })))
  }
  if (tiene('clientes.listar') || tiene('clientes.buscar')) {
    const filas = await consultar<{ id: number; nombre: string; documento_identidad: string }>(
      `SELECT id, trim(nombres || ' ' || apellidos) AS nombre, documento_identidad FROM cliente
        WHERE ${sinTildes(`nombres || ' ' || apellidos || ' ' || documento_identidad`)} LIKE '%' || $1 || '%' LIMIT 5`, [texto])
    resultados.push(...filas.map((f) => ({ tipo: 'Cliente', id: f.id, titulo: f.nombre, detalle: f.documento_identidad, enlace: `/clientes/${f.id}` })))
  }
  if (tiene('tecnicos.listar') || tiene('tecnicos.buscar')) {
    const filas = await consultar<{ id: number; nombre: string; especialidad: string | null }>(
      `SELECT id, trim(nombres || ' ' || apellidos) AS nombre, especialidad FROM tecnico
        WHERE ${sinTildes(`nombres || ' ' || apellidos || ' ' || coalesce(especialidad, '')`)} LIKE '%' || $1 || '%' LIMIT 5`, [texto])
    resultados.push(...filas.map((f) => ({ tipo: 'Técnico', id: f.id, titulo: f.nombre, detalle: f.especialidad ?? '', enlace: `/tecnicos/${f.id}` })))
  }
  if (tiene('servicios.listar') || tiene('servicios.buscar')) {
    const filas = await consultar<{ id: number; nombre: string; categoria: string }>(
      `SELECT id, nombre, categoria FROM servicio WHERE ${sinTildes(`nombre || ' ' || categoria`)} LIKE '%' || $1 || '%' LIMIT 5`, [texto])
    resultados.push(...filas.map((f) => ({ tipo: 'Servicio', id: f.id, titulo: f.nombre, detalle: f.categoria, enlace: `/servicios/${f.id}` })))
  }
  if (tiene('usuarios.listar') || tiene('usuarios.buscar')) {
    const filas = await consultar<{ id: number; nombre: string; correo: string }>(
      `SELECT id, trim(nombres || ' ' || apellidos) AS nombre, correo FROM usuario
        WHERE ${sinTildes(`nombres || ' ' || apellidos || ' ' || correo || ' ' || nombre_usuario`)} LIKE '%' || $1 || '%' LIMIT 5`, [texto])
    resultados.push(...filas.map((f) => ({ tipo: 'Usuario', id: f.id, titulo: f.nombre, detalle: f.correo, enlace: `/usuarios/${f.id}` })))
  }
  return resultados
}
