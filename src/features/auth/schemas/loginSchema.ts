import { z } from 'zod'

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo corporativo')
    .email('El correo no tiene un formato válido'),
  contrasena: z
    .string()
    .min(1, 'Ingresa tu contraseña')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  recordarme: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>
