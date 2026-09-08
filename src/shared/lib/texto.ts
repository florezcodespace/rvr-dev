/**
 * Normaliza un texto para compararlo en las búsquedas: sin tildes y en
 * minúsculas. En un portal en español el usuario escribe "clinica" y espera
 * encontrar "Clínica", así que el filtro nunca debe depender de la tilde.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
