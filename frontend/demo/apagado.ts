/** Sin modo demostración: el portal habla con la API por la red. */
const apagado = () => {
  throw new Error('El modo demostración no está activo en esta compilación.')
}
export const prepararDemo = apagado
export const atender = apagado
export const reiniciarDemo = apagado
