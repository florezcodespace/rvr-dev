/** Iniciales de un nombre o razón social: "Clínica Las Américas" → "CA". */
export function iniciales(nombre: string): string {
  const partes = nombre
    .replace(/[.]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 1 && !/^(de|del|la|las|los|y|s\.a\.s|ltda)$/i.test(p))

  if (partes.length === 0) return nombre.slice(0, 2).toUpperCase()
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase()

  return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase()
}

const ACENTOS = 7

/**
 * Color del avatar derivado del nombre: estable entre recargas y sin tener que
 * guardarlo en la base de datos.
 */
export function colorAvatar(nombre: string): string {
  let hash = 0
  for (let i = 0; i < nombre.length; i += 1) {
    hash = (hash * 31 + nombre.charCodeAt(i)) % 100_000
  }
  return `var(--rvr-av-${(hash % ACENTOS) + 1})`
}
