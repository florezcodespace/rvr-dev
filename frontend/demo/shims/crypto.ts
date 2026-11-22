/**
 * Lo mínimo de `node:crypto` que usa la API, para el modo demostración en el
 * navegador: `createHash('sha256')` síncrono, `randomBytes` y `randomInt`.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function sha256(datos: Uint8Array): Uint8Array {
  const largo = datos.length
  const bloques = Math.ceil((largo + 9) / 64)
  const m = new Uint8Array(bloques * 64)
  m.set(datos)
  m[largo] = 0x80
  const vista = new DataView(m.buffer)
  vista.setUint32(m.length - 4, (largo * 8) >>> 0)
  vista.setUint32(m.length - 8, Math.floor((largo * 8) / 0x100000000))
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const w = new Uint32Array(64)
  const rot = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  for (let b = 0; b < bloques; b++) {
    for (let i = 0; i < 16; i++) w[i] = vista.getUint32(b * 64 + i * 4)
    for (let i = 16; i < 64; i++) {
      const s0 = rot(w[i - 15]!, 7) ^ rot(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3)
      const s1 = rot(w[i - 2]!, 17) ^ rot(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10)
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0
    }
    let [a, bb, c, d, e, f, g, hh] = h as unknown as number[]
    for (let i = 0; i < 64; i++) {
      const t1 = (hh! + (rot(e!, 6) ^ rot(e!, 11) ^ rot(e!, 25)) + ((e! & f!) ^ (~e! & g!)) + K[i]! + w[i]!) >>> 0
      const t2 = ((rot(a!, 2) ^ rot(a!, 13) ^ rot(a!, 22)) + ((a! & bb!) ^ (a! & c!) ^ (bb! & c!))) >>> 0
      hh = g; g = f; f = e; e = (d! + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0
    }
    h[0] = (h[0]! + a!) >>> 0; h[1] = (h[1]! + bb!) >>> 0; h[2] = (h[2]! + c!) >>> 0; h[3] = (h[3]! + d!) >>> 0
    h[4] = (h[4]! + e!) >>> 0; h[5] = (h[5]! + f!) >>> 0; h[6] = (h[6]! + g!) >>> 0; h[7] = (h[7]! + hh!) >>> 0
  }
  const salida = new Uint8Array(32)
  const vs = new DataView(salida.buffer)
  h.forEach((v, i) => vs.setUint32(i * 4, v))
  return salida
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

class Bytes {
  readonly datos: Uint8Array
  constructor(datos: Uint8Array) {
    this.datos = datos
  }
  toString(codificacion = 'hex') {
    if (codificacion !== 'hex') throw new Error(`Codificación no soportada en el modo demo: ${codificacion}`)
    return hex(this.datos)
  }
}

export function createHash(algoritmo: string) {
  if (algoritmo !== 'sha256') throw new Error(`Hash no soportado en el modo demo: ${algoritmo}`)
  const partes: Uint8Array[] = []
  const hash = {
    update(texto: string | Uint8Array) {
      partes.push(typeof texto === 'string' ? new TextEncoder().encode(texto) : texto)
      return hash
    },
    digest(codificacion = 'hex') {
      const total = new Uint8Array(partes.reduce((s, p) => s + p.length, 0))
      let i = 0
      for (const p of partes) {
        total.set(p, i)
        i += p.length
      }
      return new Bytes(sha256(total)).toString(codificacion)
    },
  }
  return hash
}

export function randomBytes(n: number) {
  return new Bytes(crypto.getRandomValues(new Uint8Array(n)))
}

export function randomInt(minimo: number, maximo?: number) {
  const [a, b] = maximo === undefined ? [0, minimo] : [minimo, maximo]
  const rango = b - a
  const limite = Math.floor(0x100000000 / rango) * rango
  const caja = new Uint32Array(1)
  do crypto.getRandomValues(caja)
  while (caja[0]! >= limite)
  return a + (caja[0]! % rango)
}

export default { createHash, randomBytes, randomInt }
