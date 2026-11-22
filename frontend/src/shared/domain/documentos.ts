/**
 * [Feedback 4] Tipos de documento de identidad.
 * Mismas reglas que la API (api/src/comun.ts): el formulario avisa antes de
 * enviar y la API lo vuelve a revisar.
 */
export const TIPOS_DOCUMENTO = [
  { valor: 'CC', label: 'Cédula de ciudadanía' },
  { valor: 'CE', label: 'Cédula de extranjería' },
  { valor: 'TI', label: 'Tarjeta de identidad' },
  { valor: 'NIT', label: 'NIT (empresa)' },
  { valor: 'PP', label: 'Pasaporte' },
  { valor: 'PEP', label: 'Permiso especial de permanencia' },
] as const

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]['valor']

export const ETIQUETA_TIPO_DOC: Record<string, string> = Object.fromEntries(TIPOS_DOCUMENTO.map((t) => [t.valor, t.label]))

/** «1.036.987.456» → «1036987456» (así lo guarda la API). */
export const limpiarDocumento = (doc: string) => doc.replace(/[.\s]/g, '').toUpperCase()

function digitoVerificacionNit(nit: string): number {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const suma = nit.split('').reverse().reduce((s, d, i) => s + Number(d) * (pesos[i] ?? 0), 0)
  const r = suma % 11
  return r > 1 ? 11 - r : r
}

/** Error de formato del número según su tipo, o null si está bien. */
export function errorDocumento(tipo: string, bruto: string): string | null {
  const doc = limpiarDocumento(bruto)
  if (!doc) return 'El documento es obligatorio'
  switch (tipo) {
    case 'CC': return /^\d{5,10}$/.test(doc) ? null : 'La cédula solo lleva números (entre 5 y 10 dígitos).'
    case 'TI': return /^\d{10,11}$/.test(doc) ? null : 'La tarjeta de identidad lleva 10 u 11 dígitos.'
    case 'CE': return /^[0-9A-Z]{6,12}$/.test(doc) ? null : 'La cédula de extranjería lleva entre 6 y 12 caracteres, sin guiones.'
    case 'PP': return /^[0-9A-Z]{5,15}$/.test(doc) ? null : 'El pasaporte lleva entre 5 y 15 letras o números.'
    case 'PEP': return /^[0-9A-Z]{6,15}$/.test(doc) ? null : 'El PEP lleva entre 6 y 15 letras o números.'
    case 'NIT': {
      const m = /^(\d{9})(?:-(\d))?$/.exec(doc)
      if (!m) return 'El NIT lleva 9 dígitos y, opcional, el dígito de verificación: 900123456-7.'
      if (m[2] !== undefined && Number(m[2]) !== digitoVerificacionNit(m[1]!)) return 'El dígito de verificación del NIT no coincide.'
      return null
    }
    default: return 'Selecciona el tipo de documento'
  }
}
