import { z } from 'zod'
import { ESTADOS_ORDEN } from '@shared/domain/estadoOrden'

/** Estados con los que tiene sentido abrir una orden. */
export const ESTADOS_INICIALES = ESTADOS_ORDEN.filter((estado) =>
  ['nueva', 'pendiente', 'aprobada', 'programada'].includes(estado),
)

export const MAX_DIAGNOSTICO = 500
export const MAX_OBSERVACIONES = 500

export const nuevaOrdenSchema = z
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

export type NuevaOrdenFormValues = z.infer<typeof nuevaOrdenSchema>
