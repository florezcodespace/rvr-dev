/** Módulos de Node que la API importa pero que el modo demostración no usa. */
const nada = () => undefined
export const createTransport = () => ({ sendMail: async () => ({}) })
export default Object.assign(nada, { createTransport })
