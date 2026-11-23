import { z } from 'zod'
import { consultar, type Conexion } from '../db.js'
import { errorDocumento } from './comun.js'

export const camposEmpresa = {
  modalidad: z.enum(['personal', 'empresarial']).optional(),
  razonSocial: z.string().trim().max(180).optional(),
  nitEmpresa: z.string().trim().max(11).optional(),
}

type Empresa = z.infer<z.ZodObject<typeof camposEmpresa>>

export function validarEmpresa(d: Empresa, ctx: z.RefinementCtx) {
  if (d.modalidad !== 'empresarial') return
  if (!d.razonSocial) ctx.addIssue({ code: 'custom', path: ['razonSocial'], message: 'Escribe la razón social' })
  const error = errorDocumento('NIT', d.nitEmpresa ?? '')
  if (error) ctx.addIssue({ code: 'custom', path: ['nitEmpresa'], message: error })
}

export async function guardarEmpresa(tx: Conexion, clienteId: number, d: Empresa) {
  // Los clientes de API anteriores omiten modalidad y conservan el perfil vigente.
  if (!d.modalidad) return
  const empresa = d.modalidad === 'empresarial'
  await consultar('UPDATE cliente SET razon_social = $2, nit_empresa = $3 WHERE id = $1',
    [clienteId, empresa ? d.razonSocial : null, empresa ? d.nitEmpresa : null], tx)
}
