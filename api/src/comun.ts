import { z } from 'zod'

/** Tamaño de página por defecto (RNF-006: todas las tablas paginadas y filtrables). */
export const POR_PAGINA = 12

/** Parámetros comunes de un listado: búsqueda y página. */
export const listaBase = z.object({
  q: z.string().trim().max(100).default(''),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(500).default(POR_PAGINA),
})

/** Filtro de estado opcional: cadena vacía = todos. */
export const filtroOpcional = <T extends readonly [string, ...string[]]>(valores: T) =>
  z.enum(valores).optional().catch(undefined)

/** Forma común de las páginas que consume el portal. */
export function pagina<T>(items: T[], total: number, actual: number, porPagina = POR_PAGINA) {
  return {
    items,
    total,
    pagina: actual,
    porPagina,
    totalPaginas: Math.max(Math.ceil(total / porPagina), 1),
  }
}

/** Id numérico de la ruta (`/:id`). */
export const idRuta = z.coerce.number().int().positive()

/**
 * Expresión SQL que quita tildes y pasa a minúsculas, para buscar igual que el
 * portal ("clinica" encuentra "Clínica"). Con `translate` y no con la
 * extensión `unaccent` para no pedir nada extra a la base.
 */
export const sinTildes = (expresion: string) =>
  `translate(lower(${expresion}), 'áéíóúüñ', 'aeiouun')`

/** El mismo tratamiento del lado de JavaScript, para el texto que llega. */
export const normalizar = (texto: string) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export const iso = (valor: Date | string | null | undefined): string | null =>
  valor === null || valor === undefined ? null : new Date(valor).toISOString()

/** Fecha local (YYYY-MM-DD) de un Date de la base, sin correrse por la zona. */
export const fechaCorta = (valor: Date | string | null): string | null => {
  if (valor === null) return null
  if (typeof valor === 'string') return valor.slice(0, 10)
  const d = valor
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

/** Número visible de una cotización: COT-0007. */
export const numeroCotizacion = (id: number) => `COT-${String(id).padStart(4, '0')}`

/** Campos de texto de formularios: vacío → null. */
export const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const textoRequerido = (max: number, campo: string) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `${campo}: máximo ${max} caracteres`)

export const correoOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'El correo no tiene un formato válido')

export const correoRequerido = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .max(100)
  .email('El correo no tiene un formato válido')

export const telefono = z
  .string()
  .trim()
  .max(20)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[0-9+\s()-]{7,20}$/.test(v), 'El teléfono no tiene un formato válido')

export const documento = z
  .string({ error: 'El documento es obligatorio' })
  .trim()
  .min(5, 'El documento debe tener al menos 5 caracteres')
  .max(20, 'El documento admite máximo 20 caracteres')
  .regex(/^[0-9A-Za-z.-]+$/, 'El documento solo admite números, letras, puntos y guiones')

export const estadoActivo = z.object({ estado: z.enum(['activo', 'inactivo']), confirmar: z.boolean().optional() })

/** CA_73_03 · Política de contraseña: 8+ caracteres con mayúscula, minúscula y número. */
export const contrasenaSegura = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña admite máximo 72 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula')
  .regex(/[0-9]/, 'La contraseña debe tener al menos un número')

/** Rango de fechas opcional de los reportes y filtros (YYYY-MM-DD). */
export const rangoFechas = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
})
