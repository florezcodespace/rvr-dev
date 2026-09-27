import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

/** Error con código HTTP y un código de negocio que el portal sabe traducir. */
export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly extra?: Record<string, unknown>,
  ) {
    super(mensaje)
    this.name = 'ErrorHttp'
  }
}

export const noEncontrado = (que: string) =>
  new ErrorHttp(404, 'NO_ENCONTRADO', `No encontramos ${que}.`)

export const conflicto = (codigo: string, mensaje: string, extra?: Record<string, unknown>) =>
  new ErrorHttp(409, codigo, mensaje, extra)

export const regla = (codigo: string, mensaje: string, extra?: Record<string, unknown>) =>
  new ErrorHttp(422, codigo, mensaje, extra)

/**
 * Restricciones de la base → mensaje para el usuario (RNF-018: códigos de error
 * descriptivos). Así una validación de duplicado o de saldo que ataja la base
 * llega al portal igual que si la hubiera atajado la API.
 */
const RESTRICCIONES: Record<string, { estado: number; codigo: string; mensaje: string }> = {
  uq_rol_nombre: { estado: 409, codigo: 'NOMBRE_DUPLICADO', mensaje: 'Ya existe un rol con ese nombre.' },
  uq_permiso_nombre_modulo: { estado: 409, codigo: 'PERMISO_DUPLICADO', mensaje: 'Ya existe un permiso con ese nombre en ese módulo.' },
  uq_usuario_nombre_usuario: { estado: 409, codigo: 'USUARIO_DUPLICADO', mensaje: 'Ese nombre de usuario ya está en uso.' },
  uq_usuario_correo: { estado: 409, codigo: 'CORREO_EN_USO', mensaje: 'Ese correo ya está en uso por otra cuenta.' },
  uq_cliente_documento: { estado: 409, codigo: 'DOCUMENTO_DUPLICADO', mensaje: 'Ya hay un cliente con ese documento de identidad.' },
  uq_cliente_usuario: { estado: 409, codigo: 'CUENTA_VINCULADA', mensaje: 'Esa cuenta ya está vinculada a otro cliente.' },
  uq_tecnico_documento: { estado: 409, codigo: 'DOCUMENTO_DUPLICADO', mensaje: 'Ya hay un técnico con ese documento de identidad.' },
  uq_tecnico_usuario: { estado: 409, codigo: 'CUENTA_VINCULADA', mensaje: 'Esa cuenta ya está vinculada a otro técnico.' },
  uq_servicio_nombre: { estado: 409, codigo: 'NOMBRE_DUPLICADO', mensaje: 'Ya existe un servicio con ese nombre.' },
  uq_orden_codigo: { estado: 409, codigo: 'CODIGO_DUPLICADO', mensaje: 'Ese código de orden ya existe.' },
  uq_detalle_orden_item: { estado: 409, codigo: 'COTIZACION_CON_ORDEN', mensaje: 'Esa cotización ya generó una orden de servicio.' },
  uq_ventas_orden: { estado: 409, codigo: 'ORDEN_CON_VENTA', mensaje: 'Esa orden ya tiene una venta registrada.' },
  uq_diagnostico_orden: { estado: 409, codigo: 'DIAGNOSTICO_EXISTE', mensaje: 'La orden ya tiene diagnóstico.' },
  uq_agenda_tecnico_hora: { estado: 409, codigo: 'TECNICO_OCUPADO', mensaje: 'El técnico ya tiene otra visita agendada en esa fecha y hora.' },
  ck_franja_horas: { estado: 422, codigo: 'HORAS_INVALIDAS', mensaje: 'La hora de fin debe ser posterior a la hora de inicio.' },
  ck_franja_cruce: { estado: 409, codigo: 'FRANJA_CRUZADA', mensaje: 'La franja se cruza con otra del mismo técnico en esa fecha.' },
  ck_servicio_precio: { estado: 422, codigo: 'PRECIO_INVALIDO', mensaje: 'El precio base debe ser mayor que cero.' },
  ck_servicio_categoria: { estado: 422, codigo: 'CATEGORIA_INVALIDA', mensaje: 'Esa categoría no está en el listado del catálogo.' },
  ck_abono_saldo: { estado: 422, codigo: 'ABONO_SUPERA_SALDO', mensaje: 'El abono supera el saldo pendiente de la venta.' },
  ck_abono_venta_anulada: { estado: 422, codigo: 'VENTA_ANULADA', mensaje: 'La venta está anulada: no recibe abonos.' },
  ck_abono_metodo: { estado: 422, codigo: 'METODO_INVALIDO', mensaje: 'Ese método de pago no está permitido.' },
  ck_ventas_anticipo: { estado: 422, codigo: 'ANTICIPO_INVALIDO', mensaje: 'El anticipo no puede superar el monto total.' },
  ck_detalle_orden_aprobada: { estado: 422, codigo: 'COTIZACION_NO_APROBADA', mensaje: 'Solo una cotización aprobada puede dar origen a una orden.' },
  ck_detalle_orden_cliente: { estado: 422, codigo: 'ORDEN_MEZCLA_CLIENTES', mensaje: 'Una orden no puede mezclar ítems de dos clientes.' },
}

/**
 * Envuelve un manejador asíncrono para que un `reject` llegue al middleware de
 * errores. Sin esto, una promesa rechazada en Express deja la petición colgada.
 */
export function asincrono(
  manejador: (req: Request, res: Response) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    manejador(req, res).catch(next)
  }
}

export function manejadorDeErrores(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    res.status(422).json({
      codigo: 'DATOS_INVALIDOS',
      mensaje: error.issues[0]?.message ?? 'Revisa los datos enviados.',
      detalles: error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      })),
    })
    return
  }

  if (error instanceof ErrorHttp) {
    res.status(error.estado).json({
      codigo: error.codigo,
      mensaje: error.message,
      ...error.extra,
    })
    return
  }

  const pg = error as { code?: string; constraint?: string }
  const conocida = pg.constraint ? RESTRICCIONES[pg.constraint] : undefined
  if (conocida) {
    res.status(conocida.estado).json({ codigo: conocida.codigo, mensaje: conocida.mensaje })
    return
  }
  if (pg.code === '23503') {
    res.status(409).json({ codigo: 'REFERENCIA_INVALIDA', mensaje: 'El registro relacionado no existe o está en uso.' })
    return
  }

  // RNF-014 · Log de todo error inesperado, completo. Al cliente nunca se le
  // devuelve el detalle: puede traer el SQL o la cadena de conexión.
  console.error(`[error] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`, error)
  res.status(500).json({
    codigo: 'ERROR_INTERNO',
    mensaje: 'Algo falló de nuestro lado. Inténtalo de nuevo.',
  })
}
