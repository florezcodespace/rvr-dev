import { z } from 'zod'

/** CA_73_03 · Longitud mínima y condiciones de seguridad (las mismas de la API). */
export const reglaContrasena = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Z]/, 'Incluye al menos una mayúscula')
  .regex(/[a-z]/, 'Incluye al menos una minúscula')
  .regex(/[0-9]/, 'Incluye al menos un número')
