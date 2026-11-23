import { z } from 'zod'
import { errorDocumento } from './documentos'

export const camposEmpresa = {
  modalidad: z.enum(['personal', 'empresarial']),
  razonSocial: z.string().trim().max(180).optional(),
  nitEmpresa: z.string().trim().max(11).optional(),
}

export type DatosEmpresa = z.infer<z.ZodObject<typeof camposEmpresa>>

export function validarEmpresa(d: DatosEmpresa, ctx: z.RefinementCtx) {
  if (d.modalidad !== 'empresarial') return
  if (!d.razonSocial) ctx.addIssue({ code: 'custom', path: ['razonSocial'], message: 'Escribe la razón social' })
  const error = errorDocumento('NIT', d.nitEmpresa ?? '')
  if (error) ctx.addIssue({ code: 'custom', path: ['nitEmpresa'], message: error })
}
