import { z } from 'zod'
import { ESTADOS_ORDEN } from '@shared/domain/estadoOrden'

/** Estados con los que tiene sentido abrir una orden. */
export const ESTADOS_INICIALES = ESTADOS_ORDEN.filter((estado) =>
  ['nueva', 'pendiente', 'aprobada', 'programada'].includes(estado),
)

export const MAX_DIAGNOSTICO = 500
export const MAX_OBSERVACIONES = 500

const baseNuevaOrdenSchema = z
  .object({
    clienteId: z.number().int().positive('Selecciona el cliente'),
    servicioId: z.number().int().positive('Selecciona el servicio'),
    tecnicoId: z.number().int().nullable(),
    cotizacionId: z.number().int().nullable(),
    fechaProgramada: z.string().min(1, 'Indica la fecha y hora programadas'),
    estadoInicial: z.enum(ESTADOS_ORDEN),
    diagnostico: z
      .string()
      .trim()
      .min(15, 'Describe el problema reportado (mínimo 15 caracteres)')
      .max(MAX_DIAGNOSTICO, `Máximo ${MAX_DIAGNOSTICO} caracteres`),
    observaciones: z.string().max(MAX_OBSERVACIONES, `Máximo ${MAX_OBSERVACIONES} caracteres`),
  })
  .refine(
    (valores) => new Date(valores.fechaProgramada).getTime() > Date.now(),
    {
      path: ['fechaProgramada'],
      message: 'Selecciona una fecha posterior a la solicitud',
    },
  )
  .refine(
    // Programar exige técnico: es la regla del agendamiento en el modelo de datos.
    (valores) => valores.estadoInicial !== 'programada' || valores.tecnicoId !== null,
    {
      path: ['tecnicoId'],
      message: 'Para dejarla programada debes asignar un técnico',
    },
  )

/**
 * La tercera regla necesita saber qué técnicos están fuera de servicio hoy, y
 * eso vive en el catálogo, no en el formulario: por eso el esquema se
 * construye con esa lista en vez de ser un objeto suelto.
 */
export function crearNuevaOrdenSchema(tecnicosNoDisponibles: readonly number[] = []) {
  return baseNuevaOrdenSchema.refine(
    // Agendar a alguien que hoy no está disponible (novedad, incapacidad,
    // fuera de turno) crea una visita que nadie va a atender.
    (valores) =>
      valores.estadoInicial !== 'programada' ||
      valores.tecnicoId === null ||
      !tecnicosNoDisponibles.includes(valores.tecnicoId),
    {
      path: ['tecnicoId'],
      message: 'Ese técnico no está disponible hoy: elige otro o no la programes aún',
    },
  )
}

export type NuevaOrdenFormValues = z.infer<typeof baseNuevaOrdenSchema>
