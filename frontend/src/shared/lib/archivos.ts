/** [Feedback 12] Lectura de archivos adjuntos (comprobantes de pago). */

export const TIPOS_COMPROBANTE = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export const MAX_BYTES_COMPROBANTE = 3 * 1024 * 1024

export interface Adjunto {
  nombre: string
  tipo: string
  datos: string
}

/** Lee el archivo como data URL, o devuelve el motivo por el que no sirve. */
export async function leerComprobante(archivo: File): Promise<Adjunto> {
  if (!(TIPOS_COMPROBANTE as readonly string[]).includes(archivo.type)) {
    throw new Error('Sube una imagen (JPG, PNG o WEBP) o un PDF.')
  }
  if (archivo.size > MAX_BYTES_COMPROBANTE) throw new Error('El archivo supera los 3 MB. Toma una captura o comprímelo.')
  const datos = await new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result))
    lector.onerror = () => rechazar(new Error('No pudimos leer el archivo.'))
    lector.readAsDataURL(archivo)
  })
  return { nombre: archivo.name.slice(0, 150), tipo: archivo.type, datos }
}
