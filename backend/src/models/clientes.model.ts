import { z } from 'zod'
import { consultar, enTransaccion, unaFila } from '../db.js'
import {
  correoOpcional, documento, errorDocumento, filtroOpcional, iso, listaBase, normalizar, numeroCotizacion, pagina, sinTildes,
  telefono, textoOpcional, textoRequerido, tipoDocumento,
} from '../utils/comun.js'
import { correoLibreEnCuentas, crearCuentaCliente } from '../utils/cuentas.js'
import { conflicto, noEncontrado, regla } from '../utils/errores.js'

/** Venta – Órdenes · Gestión de Clientes (HU_31 – HU_35, HU_83). */

interface FilaCliente {
  id: number
  tipo_documento: string
  documento_identidad: string
  nombres: string
  apellidos: string
  telefono: string | null
  direccion: string | null
  correo: string | null
  fecha_registro: Date
  estado: string
  usuario_id: number | null
  cotizaciones: number
  ordenes: number
  ordenes_en_curso: number
}

const BASE = `
  SELECT c.*,
         (SELECT count(*) FROM cotizacion q WHERE q.cliente_id = c.id)::int AS cotizaciones,
         (SELECT count(*) FROM v_orden_cliente oc WHERE oc.cliente_id = c.id)::int AS ordenes,
         (SELECT count(*) FROM v_orden_cliente oc JOIN orden o ON o.id = oc.orden_id
           WHERE oc.cliente_id = c.id AND o.estado NOT IN ('finalizada', 'cancelada'))::int AS ordenes_en_curso
    FROM cliente c
`

const aCliente = (f: FilaCliente) => ({
  id: f.id,
  tipoDocumento: f.tipo_documento,
  documento: f.documento_identidad,
  nombres: f.nombres,
  apellidos: f.apellidos,
  nombre: `${f.nombres} ${f.apellidos}`.trim(),
  telefono: f.telefono ?? '',
  direccion: f.direccion ?? '',
  correo: f.correo ?? '',
  fechaRegistro: iso(f.fecha_registro),
  estado: f.estado,
  tieneCuenta: f.usuario_id !== null,
  cotizaciones: f.cotizaciones,
  ordenes: f.ordenes,
  ordenesEnCurso: f.ordenes_en_curso,
})

export const filtroOpciones = z.object({
  q: z.string().trim().max(100).default(''),
  todos: z.coerce.boolean().default(false),
  id: z.coerce.number().int().positive().optional().catch(undefined),
})

/** Clientes activos para los selects (CA_83_02: un inactivo no recibe cotizaciones). */
export function opciones({ q, todos, id }: z.infer<typeof filtroOpciones>) {
  return consultar(
    `SELECT id, trim(nombres || ' ' || apellidos) AS nombre, documento_identidad AS documento, direccion, estado
       FROM cliente
      WHERE ($2 OR estado = 'activo')
        AND ($3::int IS NULL OR id = $3)
        AND ($1 = '' OR ${sinTildes(`nombres || ' ' || apellidos || ' ' || documento_identidad`)} LIKE '%' || $1 || '%')
      ORDER BY nombres, apellidos LIMIT 50`,
    [normalizar(q), todos, id ?? null],
  )
}

export const filtroDisponible = z.object({
  campo: z.enum(['documento', 'correo']),
  valor: z.string().trim().max(100),
  excepto: z.coerce.number().int().nonnegative().catch(0),
})

/** [Feedback 5] Revisa un dato único mientras se llena el formulario. */
export async function disponible(q: z.infer<typeof filtroDisponible>) {
  const valor = q.campo === 'documento' ? q.valor.replace(/[.\s]/g, '').toUpperCase() : q.valor.toLowerCase()
  const columna = q.campo === 'documento' ? 'documento_identidad' : 'correo'
  const fila = await unaFila<{ id: number; nombre: string; con_cuenta: boolean }>(
    `SELECT id, trim(nombres || ' ' || apellidos) AS nombre, usuario_id IS NOT NULL AS con_cuenta
       FROM cliente WHERE ${columna} = $1 AND id <> $2`,
    [valor, q.excepto],
  )
  return fila ? { disponible: false, cliente: { id: fila.id, nombre: fila.nombre, conCuenta: fila.con_cuenta } } : { disponible: true }
}

export const filtroClientes = listaBase.extend({
  estado: filtroOpcional(['activo', 'inactivo'] as const),
  // CA_33_02 · ordenar por nombre o por fecha de registro
  orden: z.enum(['nombre', 'fecha']).catch('fecha'),
})

/** HU_33 listar · HU_32 buscar por nombres, apellidos, documento, teléfono o estado */
export async function listar(p: z.infer<typeof filtroClientes>) {
  const filas = await consultar<FilaCliente & { total: number }>(
    `WITH base AS (${BASE})
     SELECT *, count(*) OVER ()::int AS total FROM base
      WHERE ($1 = '' OR ${sinTildes(`nombres || ' ' || apellidos || ' ' || documento_identidad || ' ' || coalesce(telefono, '') || ' ' || coalesce(correo, '')`)} LIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR estado = $2)
      ORDER BY ${p.orden === 'nombre' ? 'nombres, apellidos' : 'fecha_registro DESC'}
      LIMIT $3 OFFSET $4`,
    [normalizar(p.q), p.estado ?? null, p.porPagina, (p.pagina - 1) * p.porPagina],
  )
  const conteos = await unaFila<Record<string, number>>(
    `SELECT count(*)::int AS todos,
            count(*) FILTER (WHERE estado = 'activo')::int AS activo,
            count(*) FILTER (WHERE estado = 'inactivo')::int AS inactivo,
            count(*) FILTER (WHERE usuario_id IS NOT NULL)::int AS con_cuenta,
            count(*) FILTER (WHERE fecha_registro >= date_trunc('month', now()))::int AS nuevos_mes
       FROM cliente`,
  )
  return { ...pagina(filas.map(aCliente), filas[0]?.total ?? 0, p.pagina, p.porPagina), conteos }
}

/** HU_35 · Ver detalle */
export async function detalle(id: number) {
  const fila = await unaFila<FilaCliente>(`${BASE} WHERE c.id = $1`, [id])
  if (!fila) throw noEncontrado('ese cliente')

  // CA_35_02 · historial de cotizaciones con estado y monto
  // CA_35_03 · y la orden que generó cada una
  const cotizaciones = await consultar<{
    id: number; fecha_cotizacion: Date; estado: string; monto_total: number; origen: string; orden_id: number | null; codigo_orden: string | null
  }>(
    `SELECT q.id, q.fecha_cotizacion, q.estado, q.monto_total, q.origen,
            o.id AS orden_id, o.codigo_orden
       FROM cotizacion q
       LEFT JOIN LATERAL (
         SELECT d.orden_id FROM detalle_cotizacion dc JOIN detalle_orden d ON d.detalle_cotizacion_id = dc.id
          WHERE dc.cotizacion_id = q.id LIMIT 1) x ON true
       LEFT JOIN orden o ON o.id = x.orden_id
      WHERE q.cliente_id = $1
      ORDER BY q.fecha_cotizacion DESC`,
    [id],
  )
  const ordenes = await consultar<{ id: number; codigo_orden: string; fecha_creacion: Date; estado: string; monto: number | null; saldo: number | null }>(
    `SELECT o.id, o.codigo_orden, o.fecha_creacion, o.estado, v.monto_total AS monto, v.saldo
       FROM v_orden_cliente oc
       JOIN orden o ON o.id = oc.orden_id
       LEFT JOIN v_ventas v ON v.orden_id = o.id AND v.estado_pago <> 'anulada'
      WHERE oc.cliente_id = $1
      ORDER BY o.fecha_creacion DESC`,
    [id],
  )
  const cartera = await unaFila<{ facturado: number; abonado: number; saldo: number }>(
    `SELECT coalesce(sum(monto_total), 0) AS facturado, coalesce(sum(abonado), 0) AS abonado, coalesce(sum(saldo), 0) AS saldo
       FROM v_ventas WHERE cliente_id = $1 AND estado_pago <> 'anulada'`,
    [id],
  )
  return {
    ...aCliente(fila),
    cartera,
    historialCotizaciones: cotizaciones.map((q) => ({
      id: q.id,
      numero: numeroCotizacion(q.id),
      fecha: iso(q.fecha_cotizacion),
      estado: q.estado,
      montoTotal: q.monto_total,
      origen: q.origen,
      orden: q.orden_id ? { id: q.orden_id, codigo: q.codigo_orden } : null,
    })),
    historialOrdenes: ordenes.map((o) => ({
      id: o.id,
      codigo: o.codigo_orden,
      fecha: iso(o.fecha_creacion),
      estado: o.estado,
      monto: o.monto,
      saldo: o.saldo,
    })),
  }
}

/** [Feedback 5] Orden de los datos: identificación, nombre, contacto y ubicación. */
export const datosCliente = z
  .object({
    tipoDocumento,
    documento,
    nombres: textoRequerido(100, 'Los nombres'),
    apellidos: textoRequerido(100, 'Los apellidos'),
    correo: correoOpcional,
    telefono,
    direccion: textoOpcional(150),
    // [Feedback 7] Al registrarlo, crear también su cuenta del portal
    crearAcceso: z.boolean().optional().default(false),
  })
  .superRefine((d, ctx) => {
    const error = errorDocumento(d.tipoDocumento, d.documento)
    if (error) ctx.addIssue({ code: 'custom', path: ['documento'], message: error })
    if (d.crearAcceso && !d.correo) {
      ctx.addIssue({ code: 'custom', path: ['correo'], message: 'Para darle acceso al portal, el correo es obligatorio.' })
    }
  })
type DatosCliente = z.infer<typeof datosCliente>

/** Error de duplicado que el formulario pinta en su campo. */
const duplicado = (codigo: string, campo: string, mensaje: string) =>
  conflicto(codigo, mensaje, { detalles: [{ campo, mensaje }] })

async function documentoLibre(doc: string, excepto = 0) {
  if (await unaFila(`SELECT 1 FROM cliente WHERE documento_identidad = $1 AND id <> $2`, [doc, excepto])) {
    throw duplicado('DOCUMENTO_DUPLICADO', 'documento', 'Ya hay un cliente con ese documento de identidad.')
  }
}

async function correoLibre(correo: string | null, excepto = 0) {
  if (correo && await unaFila(`SELECT 1 FROM cliente WHERE correo = $1 AND id <> $2`, [correo, excepto])) {
    throw duplicado('CORREO_DUPLICADO', 'correo', 'Ya hay un cliente con ese correo.')
  }
}

/** HU_31 · Registrar (CA_31_04: fecha de registro automática; CA_31_05: activo) */
export async function registrar(d: DatosCliente) {
  await documentoLibre(d.documento)
  await correoLibre(d.correo)
  if (d.crearAcceso) await correoLibreEnCuentas(d.correo!)
  const { id, acceso } = await enTransaccion(async (tx) => {
    const fila = await unaFila<{ id: number }>(
      `INSERT INTO cliente (tipo_documento, documento_identidad, nombres, apellidos, telefono, direccion, correo, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
      [d.tipoDocumento, d.documento, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo],
      tx,
    )
    const acceso = d.crearAcceso
      ? await crearCuentaCliente(tx, { clienteId: fila!.id, correo: d.correo!, nombres: d.nombres, apellidos: d.apellidos, telefono: d.telefono })
      : null
    return { id: fila!.id, acceso }
  })
  return { ...(await detalle(id)), acceso }
}

/** [Feedback 7] Dar acceso al portal a un cliente registrado por el administrador. */
export async function darAcceso(id: number) {
  const actual = await detalle(id)
  if (actual.tieneCuenta) throw conflicto('YA_TIENE_CUENTA', 'Este cliente ya tiene cuenta en el portal.')
  if (actual.estado !== 'activo') throw regla('CLIENTE_INACTIVO', 'Activa el cliente antes de darle acceso al portal.')
  if (!actual.correo) throw regla('SIN_CORREO', 'Registra el correo del cliente antes de darle acceso al portal.')
  const acceso = await enTransaccion((tx) => crearCuentaCliente(tx, {
    clienteId: id, correo: actual.correo, nombres: actual.nombres, apellidos: actual.apellidos, telefono: actual.telefono || null,
  }))
  return { ...(await detalle(id)), acceso }
}

/** HU_34 · Editar */
export async function editar(id: number, d: DatosCliente) {
  const actual = await detalle(id)
  await documentoLibre(d.documento, id)
  await correoLibre(d.correo, id)
  if (actual.tieneCuenta && !d.correo) throw duplicado('CORREO_OBLIGATORIO', 'correo', 'El cliente tiene cuenta en el portal: el correo es obligatorio.')
  const usuarioId = (await unaFila<{ usuario_id: number | null }>(`SELECT usuario_id FROM cliente WHERE id = $1`, [id]))?.usuario_id ?? 0
  if (actual.tieneCuenta) await correoLibreEnCuentas(d.correo!, usuarioId)
  await enTransaccion(async (tx) => {
    await consultar(
      `UPDATE cliente SET tipo_documento = $8, documento_identidad = $2, nombres = $3, apellidos = $4, telefono = $5, direccion = $6, correo = $7
        WHERE id = $1`,
      [id, d.documento, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo, d.tipoDocumento],
      tx,
    )
    // Si tiene cuenta en el portal, su nombre y teléfono van juntos.
    if (actual.tieneCuenta) {
      await consultar(
        `UPDATE usuario u SET nombres = $2, apellidos = $3, telefono = $4, correo = $5
           FROM cliente c WHERE c.id = $1 AND u.id = c.usuario_id`,
        [id, d.nombres, d.apellidos, d.telefono, d.correo],
        tx,
      )
    }
  })
  return detalle(id)
}

export const datosEstado = z.object({ estado: z.enum(['activo', 'inactivo']), confirmar: z.boolean().optional() })

/** HU_83 · Cambiar estado (CA_83_05: no se eliminan) */
export async function cambiarEstado(id: number, { estado, confirmar }: z.infer<typeof datosEstado>) {
  const actual = await detalle(id)
  // CA_83_03 · advertencia si tiene órdenes en curso
  if (estado === 'inactivo' && actual.ordenesEnCurso > 0 && !confirmar) {
    throw conflicto('CONFIRMAR_CAMBIO',
      `${actual.nombre} tiene ${actual.ordenesEnCurso} orden(es) de servicio en curso. Esas órdenes siguen su proceso, pero el cliente no podrá solicitar servicios ni recibir cotizaciones nuevas.`,
      { ordenesEnCurso: actual.ordenesEnCurso })
  }
  await enTransaccion(async (tx) => {
    await consultar(`UPDATE cliente SET estado = $2 WHERE id = $1`, [id, estado], tx)
    // CA_83_04 · con cuenta en el portal: al inactivarlo no puede iniciar sesión
    // (el login lo revisa) y sus sesiones abiertas se cierran.
    if (estado === 'inactivo') {
      await consultar(
        `UPDATE usuario u SET version_sesion = version_sesion + 1 FROM cliente c WHERE c.id = $1 AND u.id = c.usuario_id`,
        [id],
        tx,
      )
    }
  })
  return detalle(id)
}
