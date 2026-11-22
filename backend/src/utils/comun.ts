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
  .regex(/^[0-9A-Za-z.\s-]+$/, 'El documento solo admite números, letras, puntos y guiones')
  // «1.036.987.456» y «1036987456» son el mismo documento: se guarda sin puntos ni espacios
  .transform((v) => v.replace(/[.\s]/g, '').toUpperCase())

/** [Feedback 4] Tipos de documento de identidad aceptados. */
export const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'NIT', 'PP', 'PEP'] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

export const tipoDocumento = z.enum(TIPOS_DOCUMENTO, { error: 'Selecciona el tipo de documento' }).default('CC')

/** Dígito de verificación de un NIT (algoritmo de la DIAN). */
export function digitoVerificacionNit(nit: string): number {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const digitos = nit.split('').reverse()
  const suma = digitos.reduce((s, d, i) => s + Number(d) * (pesos[i] ?? 0), 0)
  const r = suma % 11
  return r > 1 ? 11 - r : r
}

/** Formato del número según su tipo de documento. Devuelve el error o null. */
export function errorDocumento(tipo: TipoDocumento, doc: string): string | null {
  switch (tipo) {
    case 'CC':
      return /^\d{5,10}$/.test(doc) ? null : 'La cédula solo lleva números (entre 5 y 10 dígitos).'
    case 'TI':
      return /^\d{10,11}$/.test(doc) ? null : 'La tarjeta de identidad lleva 10 u 11 dígitos.'
    case 'CE':
      return /^[0-9A-Z]{6,12}$/.test(doc) ? null : 'La cédula de extranjería lleva entre 6 y 12 caracteres, sin guiones.'
    case 'PP':
      return /^[0-9A-Z]{5,15}$/.test(doc) ? null : 'El pasaporte lleva entre 5 y 15 letras o números.'
    case 'PEP':
      return /^[0-9A-Z]{6,15}$/.test(doc) ? null : 'El PEP lleva entre 6 y 15 letras o números.'
    case 'NIT': {
      const m = /^(\d{9})(?:-(\d))?$/.exec(doc)
      if (!m) return 'El NIT lleva 9 dígitos y, opcional, el dígito de verificación: 900123456-7.'
      if (m[2] !== undefined && Number(m[2]) !== digitoVerificacionNit(m[1]!)) return 'El dígito de verificación del NIT no coincide.'
      return null
    }
  }
}

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
