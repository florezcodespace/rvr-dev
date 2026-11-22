// Genera frontend/src/shared/lib/tarjetas/bins-colombia.ts desde bin-list-data.csv.
// Uso: node generar-bins.cjs <csv> <salida.ts>
const fs = require('fs')
const [csv, salida] = process.argv.slice(2)

function filas(texto) {
  const out = []
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea) continue
    const campos = []
    let actual = '', comillas = false
    for (const c of linea) {
      if (c === '"') comillas = !comillas
      else if (c === ',' && !comillas) { campos.push(actual); actual = '' }
      else actual += c
    }
    campos.push(actual)
    out.push(campos)
  }
  return out
}

// El orden importa: lo más específico primero.
const NOMBRES = [
  [/NEQUI/, 'Nequi'],
  [/RAPPIPAY/, 'RappiPay'],
  [/BANCOLOMBIA/, 'Bancolombia'],
  [/DC COLOMBIA/, 'Diners Club Colombia'],
  [/DAVIVIENDA/, 'Davivienda'],
  [/COLPATRIA|COPLATRIA|SCOTIABANK/, 'Scotiabank Colpatria'],
  [/OCCIDENTE/, 'Banco de Occidente'],
  [/BANCO DE BOGOTA/, 'Banco de Bogotá'],
  [/BBVA|BILBAO|GANADERO/, 'BBVA'],
  [/TUYA|EXITO/, 'Tuya'],
  [/COOPCENTRAL/, 'Banco Coopcentral'],
  [/ITAU|CORPBANCA|HELM/, 'Itaú'],
  [/POPULAR/, 'Banco Popular'],
  [/SUDAMERIS/, 'Banco GNB Sudameris'],
  [/COOMEVA/, 'Bancoomeva'],
  [/CAJA SOCIAL|BCSC/, 'Banco Caja Social'],
  [/AV VILLAS|A TODA HORA/, 'Banco AV Villas'],
  [/AGRARIO|AGROPECUARIA/, 'Banco Agrario'],
  [/SERFINANZA/, 'Banco Serfinanza'],
  [/PICHINCHA/, 'Banco Pichincha'],
  [/FINANDINA/, 'Banco Finandina'],
  [/FALABELLA/, 'Banco Falabella'],
  [/MOVII/, 'Movii'],
  [/CITIBANK/, 'Citibank'],
  [/SANTANDER/, 'Banco Santander'],
  [/NU PAGAMENTOS/, 'Nu Colombia'],
  [/LULO/, 'Lulo Bank'],
  [/CONFIAR/, 'Confiar'],
  [/JURISCOOP/, 'Financiera Juriscoop'],
  [/CREDIBANCO/, 'Credibanco'],
  [/SERVIBANCA/, 'Servibanca'],
  [/AVAL SOLUCIONES/, 'Dale!'],
  [/BANCO W\b/, 'Banco W'],
  [/MUNDO MUJER/, 'Banco Mundo Mujer'],
  [/BOLD/, 'Bold'],
  [/COLTEFINANCIERA/, 'Coltefinanciera'],
  [/COMULTRASAN/, 'Financiera Comultrasan'],
  [/AMERICAN EXPRESS/, 'American Express'],
]

const titulo = (s) => s
  .replace(/\*\*.*?\*\*/g, '')
  .replace(/\s+S\.A\.\s+C\.F\.C\.$/i, '')
  .replace(/,?\s+S\.\s?A\.?(\s?S\.?)?$/i, '')
  .replace(/,?\s+(SAS|SA)$/, '')
  .replace(/\s+SA\s+COMPANIA DE FINANCIAMIENTO$/, '')
  .replace(/\s+S\.A\.\s+Y\/O\s+/, ' / ')
  .trim()
  .toLowerCase()
  .replace(/(^|[\s(/])\S/g, (m) => m.toUpperCase())
  .replace(/\b(De|Del|Y)\b/g, (m) => m.toLowerCase())
  .replace(/\b(Cf|Bpc|Gde|Jfk|Abn)\b/g, (m) => m.toUpperCase())

const MARCAS = { VISA: 'Visa', MASTERCARD: 'Mastercard', 'AMERICAN EXPRESS': 'American Express', 'DINERS CLUB INTERNATIONAL': 'Diners Club', MAESTRO: 'Maestro', DISCOVER: 'Discover', 'CHINA UNION PAY': 'UnionPay', CODENSA: 'Codensa' }

const todas = filas(fs.readFileSync(csv, 'utf8'))
const i = Object.fromEntries(todas[0].map((c, n) => [c, n]))
const bancos = []
const bins = []
for (const f of todas.slice(1)) {
  if (f[i.isoCode2] !== 'CO') continue
  const marca = MARCAS[f[i.Brand]]
  if (!marca) continue // UATP (aerolíneas) y marcas privadas sin uso aquí
  const emisor = f[i.Issuer].trim()
  if (!emisor || /MAESTRO INTERNATIONAL|INTERNAL ONLY|INTL HDQTRS|HUB SITE|FIDELITY|SUPER PAGAMENTOS|CACAO|AVIANCA/.test(emisor)) continue
  const nombre = (NOMBRES.find(([re]) => re.test(emisor)) ?? [null, titulo(emisor)])[1]
  let b = bancos.indexOf(nombre)
  if (b < 0) b = bancos.push(nombre) - 1
  bins.push(`${f[i.BIN]}${f[i.Type] === 'DEBIT' ? 'D' : 'C'}${b.toString(36)}`)
}
bins.sort()

const ts = `/**
 * BIN (primeros 6 dígitos) de tarjetas emitidas en Colombia → banco y tipo.
 *
 * Generado desde «bin-list-data» de Venelin Kochev (actualización de feb/2025),
 * licencia CC-BY-4.0: https://github.com/venelinkochev/bin-list-data
 * Solo se dejaron las tarjetas de Colombia y se unificaron los nombres de los
 * bancos. Para actualizarlo: ver .claude/docs/metodos-de-pago.md.
 */
export const BANCOS_BIN = ${JSON.stringify(bancos)} as const

/** Cada entrada: 6 dígitos + C (crédito) o D (débito) + índice del banco en base 36. */
export const BINS_COLOMBIA = '${bins.join(' ')}'
`
fs.writeFileSync(salida, ts)
console.log(`${bins.length} BINs, ${bancos.length} bancos, ${Math.round(ts.length / 1024)} KB`)
console.log(bancos.join(' | '))
