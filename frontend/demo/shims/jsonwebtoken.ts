/**
 * `jsonwebtoken` del modo demostración. La API corre dentro del navegador, así
 * que el token no viaja a ningún servidor: basta con un sobre legible que
 * conserve el contenido y la caducidad.
 */
const b64 = (texto: string) => btoa(unescape(encodeURIComponent(texto))).replace(/=+$/, '')
const deB64 = (texto: string) => decodeURIComponent(escape(atob(texto)))

export function sign(contenido: object, _clave: string, opciones: { expiresIn?: number } = {}) {
  const ahora = Math.floor(Date.now() / 1000)
  const cuerpo = { ...contenido, iat: ahora, ...(opciones.expiresIn ? { exp: ahora + opciones.expiresIn } : {}) }
  return `demo.${b64(JSON.stringify(cuerpo))}.rvr`
}

export function verify(token: string) {
  const [marca, cuerpo] = token.split('.')
  if (marca !== 'demo' || !cuerpo) throw new Error('Token inválido')
  const datos = JSON.parse(deB64(cuerpo)) as { exp?: number }
  if (datos.exp && datos.exp < Date.now() / 1000) throw new Error('Token vencido')
  return datos
}

export default { sign, verify }
