/**
 * Exportación de reportes desde el navegador (HU_62): PDF y Excel (.xlsx) de
 * verdad, sin librerías. Lo que se descarga es exactamente lo que se ve, con
 * los filtros aplicados, la fecha de generación y el período (CA_62_03).
 */

export interface ColumnaExport<T> {
  titulo: string
  valor: (fila: T) => string | number | null | undefined
  /** Peso relativo del ancho en el PDF (1 por defecto). */
  ancho?: number
  /** Formato numérico en Excel y alineación a la derecha en el PDF. */
  tipo?: 'texto' | 'numero' | 'moneda'
}

export interface Encabezado {
  titulo: string
  /** «Período: 01/08/2026 – 31/08/2026», filtros aplicados… */
  lineas: string[]
}

/** Nombre con fecha para que dos descargas del mismo reporte no se pisen. */
export function nombreConFecha(base: string, extension: string): string {
  const hoy = new Date()
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${base}-${hoy.getFullYear()}${dos(hoy.getMonth() + 1)}${dos(hoy.getDate())}-${dos(hoy.getHours())}${dos(hoy.getMinutes())}.${extension}`
}

function descargar(nombre: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  // Se libera en el siguiente cuadro: revocar antes cancela la descarga en Safari.
  requestAnimationFrame(() => URL.revokeObjectURL(url))
}

const generadoEl = () =>
  `Generado el ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}`

const moneda = (n: number) => `$ ${Math.round(n).toLocaleString('es-CO')}`

function texto<T>(col: ColumnaExport<T>, fila: T): string {
  const v = col.valor(fila)
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return col.tipo === 'moneda' ? moneda(v) : v.toLocaleString('es-CO')
  return String(v)
}

// ===================================================================== CSV

export function descargarCsv<T>(nombre: string, filas: T[], columnas: ColumnaExport<T>[]) {
  const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const lineas = [
    columnas.map((c) => esc(c.titulo)).join(';'),
    ...filas.map((f) => columnas.map((c) => esc(String(c.valor(f) ?? ''))).join(';')),
  ]
  descargar(nombre, new Blob([`﻿${lineas.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' }))
}

// ===================================================================== XLSX

const TABLA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(datos: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** ZIP sin compresión (método «stored»): suficiente para un .xlsx. */
function zip(archivos: { nombre: string; contenido: string }[]): Blob {
  const cod = new TextEncoder()
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let desplazamiento = 0

  for (const a of archivos) {
    const nombre = cod.encode(a.nombre)
    const datos = cod.encode(a.contenido)
    const crc = crc32(datos)
    const local = new Uint8Array(30 + nombre.length)
    const v = new DataView(local.buffer)
    v.setUint32(0, 0x04034b50, true)
    v.setUint16(4, 20, true)
    v.setUint16(6, 0x0800, true) // nombres UTF-8
    v.setUint16(8, 0, true)
    v.setUint32(14, crc, true)
    v.setUint32(18, datos.length, true)
    v.setUint32(22, datos.length, true)
    v.setUint16(26, nombre.length, true)
    local.set(nombre, 30)
    partes.push(local, datos)

    const cab = new Uint8Array(46 + nombre.length)
    const w = new DataView(cab.buffer)
    w.setUint32(0, 0x02014b50, true)
    w.setUint16(4, 20, true)
    w.setUint16(6, 20, true)
    w.setUint16(8, 0x0800, true)
    w.setUint32(16, crc, true)
    w.setUint32(20, datos.length, true)
    w.setUint32(24, datos.length, true)
    w.setUint16(28, nombre.length, true)
    w.setUint32(42, desplazamiento, true)
    cab.set(nombre, 46)
    central.push(cab)
    desplazamiento += local.length + datos.length
  }

  const tamCentral = central.reduce((s, c) => s + c.length, 0)
  const fin = new Uint8Array(22)
  const f = new DataView(fin.buffer)
  f.setUint32(0, 0x06054b50, true)
  f.setUint16(8, archivos.length, true)
  f.setUint16(10, archivos.length, true)
  f.setUint32(12, tamCentral, true)
  f.setUint32(16, desplazamiento, true)
  return new Blob([...partes, ...central, fin] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // Caracteres de control que Excel rechaza
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')

function columnaLetra(i: number): string {
  let s = ''
  let n = i + 1
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/**
 * Descarga un .xlsx con título, líneas de contexto, encabezado en negrilla,
 * números como números (se pueden sumar en Excel) y fila de totales opcional.
 */
export function descargarExcel<T>(
  nombre: string,
  encabezado: Encabezado,
  columnas: ColumnaExport<T>[],
  filas: T[],
  totales?: (string | number | null)[],
) {
  const celdaTexto = (ref: string, v: string, estilo = 0) =>
    `<c r="${ref}" t="inlineStr"${estilo ? ` s="${estilo}"` : ''}><is><t xml:space="preserve">${xml(v)}</t></is></c>`
  const celdaNumero = (ref: string, v: number, estilo = 0) => `<c r="${ref}"${estilo ? ` s="${estilo}"` : ''}><v>${v}</v></c>`

  const filasXml: string[] = []
  let r = 1
  filasXml.push(`<row r="${r}">${celdaTexto(`A${r}`, encabezado.titulo, 3)}</row>`)
  r++
  for (const linea of [...encabezado.lineas, generadoEl()]) {
    filasXml.push(`<row r="${r}">${celdaTexto(`A${r}`, linea, 4)}</row>`)
    r++
  }
  r++
  const filaCabecera = r
  filasXml.push(`<row r="${r}">${columnas.map((c, i) => celdaTexto(`${columnaLetra(i)}${r}`, c.titulo, 1)).join('')}</row>`)
  r++
  for (const fila of filas) {
    const celdas = columnas.map((c, i) => {
      const ref = `${columnaLetra(i)}${r}`
      const v = c.valor(fila)
      if (typeof v === 'number' && (c.tipo === 'numero' || c.tipo === 'moneda')) {
        return celdaNumero(ref, v, c.tipo === 'moneda' ? 2 : 0)
      }
      return celdaTexto(ref, v === null || v === undefined ? '' : String(v))
    })
    filasXml.push(`<row r="${r}">${celdas.join('')}</row>`)
    r++
  }
  if (totales) {
    const celdas = totales.map((v, i) => {
      const ref = `${columnaLetra(i)}${r}`
      if (typeof v === 'number') return celdaNumero(ref, v, columnas[i]?.tipo === 'moneda' ? 5 : 6)
      return celdaTexto(ref, v ?? '', 5)
    })
    filasXml.push(`<row r="${r}">${celdas.join('')}</row>`)
  }

  const anchos = columnas.map((c, i) => {
    const largo = Math.max(c.titulo.length, ...filas.slice(0, 300).map((f) => texto(c, f).length))
    return `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(largo + 2, 10), 60)}" customWidth="1"/>`
  })

  const hoja = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="${filaCabecera}" topLeftCell="A${filaCabecera + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${anchos.join('')}</cols>
<sheetData>${filasXml.join('')}</sheetData>
<autoFilter ref="A${filaCabecera}:${columnaLetra(columnas.length - 1)}${filaCabecera + filas.length}"/>
</worksheet>`

  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot; #,##0"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF4F46E5"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="7">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="164" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
</styleSheet>`

  const blob = zip([
    {
      nombre: '[Content_Types].xml',
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      nombre: '_rels/.rels',
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      nombre: 'xl/workbook.xml',
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${xml(encabezado.titulo.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '))}" sheetId="1" r:id="rId1"/></sheets>
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xml(encabezado.titulo.slice(0, 31).replace(/[\\/?*[\]:']/g, ' '))}'!$A$${filaCabecera}:$${columnaLetra(columnas.length - 1)}$${filaCabecera + filas.length}</definedName></definedNames>
</workbook>`,
    },
    {
      nombre: 'xl/_rels/workbook.xml.rels',
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { nombre: 'xl/styles.xml', contenido: estilos },
    { nombre: 'xl/worksheets/sheet1.xml', contenido: hoja },
  ])
  descargar(nombre, blob)
}

// ====================================================================== PDF

/** Anchos de Helvetica (AFM, 1/1000 em) para los caracteres 32–126. */
const ANCHO_HELV = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584]
const ANCHO_HELV_B = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]

const WIN_ANSI: Record<string, number> = {
  '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99,
}

/** Texto → bytes WinAnsi (latin-1 + comillas y guiones tipográficos). */
function aWinAnsi(s: string): string {
  let salida = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    if (WIN_ANSI[ch] !== undefined) salida += String.fromCharCode(WIN_ANSI[ch]!)
    else if (c < 256) salida += ch
    else if (ch === '✓') salida += 'Si'
    else if (ch === '·') salida += String.fromCharCode(0xb7)
    else salida += '?'
  }
  return salida
}

function anchoTexto(s: string, tam: number, negrilla = false): number {
  const tabla = negrilla ? ANCHO_HELV_B : ANCHO_HELV
  let total = 0
  for (const ch of s.normalize('NFD').replace(/[̀-ͯ]/g, '')) {
    const c = ch.charCodeAt(0)
    total += c >= 32 && c <= 126 ? tabla[c - 32]! : 556
  }
  return (total * tam) / 1000
}

function recortar(s: string, ancho: number, tam: number, negrilla = false): string {
  if (anchoTexto(s, tam, negrilla) <= ancho) return s
  let t = s
  while (t.length > 1 && anchoTexto(`${t}…`, tam, negrilla) > ancho) t = t.slice(0, -1)
  return `${t}…`
}

const escPdf = (s: string) => aWinAnsi(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

/**
 * Descarga un PDF (A4 horizontal) con encabezado, tabla paginada con la fila
 * de títulos repetida en cada página, totales y numeración de páginas.
 */
export function descargarPdf<T>(
  nombre: string,
  encabezado: Encabezado,
  columnas: ColumnaExport<T>[],
  filas: T[],
  totales?: (string | number | null)[],
  resumen?: { etiqueta: string; valor: string }[],
) {
  const W = 842
  const H = 595
  const M = 36
  const anchoUtil = W - 2 * M
  const pesos = columnas.map((c) => c.ancho ?? 1)
  const sumaPesos = pesos.reduce((a, b) => a + b, 0)
  const anchos = pesos.map((p) => (p / sumaPesos) * anchoUtil)
  const altoFila = 17
  const tam = 8.5

  const paginas: string[][] = []
  let ops: string[] = []
  let y = 0

  const txt = (x: number, yy: number, s: string, t = tam, negrilla = false, color = '0.12 0.13 0.16') =>
    ops.push(`BT ${color} rg /${negrilla ? 'F2' : 'F1'} ${t} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${escPdf(s)}) Tj ET`)

  const cabeceraTabla = () => {
    ops.push(`0.31 0.27 0.9 rg ${M} ${(y - altoFila + 4).toFixed(2)} ${anchoUtil} ${altoFila} re f`)
    let x = M
    columnas.forEach((c, i) => {
      const w = anchos[i]!
      const s = recortar(c.titulo.toUpperCase(), w - 8, 7.5, true)
      const dx = c.tipo === 'moneda' || c.tipo === 'numero' ? w - 4 - anchoTexto(s, 7.5, true) : 4
      txt(x + dx, y - 8, s, 7.5, true, '1 1 1')
      x += w
    })
    y -= altoFila
  }

  const nuevaPagina = (primera: boolean) => {
    if (ops.length) paginas.push(ops)
    ops = []
    y = H - M
    if (primera) {
      txt(M, y - 14, 'RvR Tecnologías S.A.S. · Portal RvR', 9, true, '0.31 0.27 0.9')
      txt(M, y - 34, encabezado.titulo, 17, true)
      y -= 50
      for (const linea of [...encabezado.lineas, generadoEl()]) {
        txt(M, y, linea, 9, false, '0.35 0.37 0.42')
        y -= 13
      }
      if (resumen?.length) {
        y -= 6
        const anchoCaja = Math.min(170, anchoUtil / resumen.length - 8)
        resumen.forEach((r, i) => {
          const x = M + i * (anchoCaja + 8)
          ops.push(`0.94 0.95 1 rg ${x} ${(y - 34).toFixed(2)} ${anchoCaja} 38 re f`)
          txt(x + 8, y - 12, recortar(r.etiqueta.toUpperCase(), anchoCaja - 16, 7, true), 7, true, '0.4 0.42 0.48')
          txt(x + 8, y - 27, recortar(r.valor, anchoCaja - 16, 12, true), 12, true)
        })
        y -= 46
      }
      y -= 8
    } else {
      txt(M, y - 10, encabezado.titulo, 10, true, '0.35 0.37 0.42')
      y -= 24
    }
    cabeceraTabla()
  }

  nuevaPagina(true)

  if (filas.length === 0) {
    txt(M + 4, y - 14, 'No hay datos en el período seleccionado.', 10, false, '0.4 0.42 0.48')
    y -= 24
  }

  filas.forEach((fila, n) => {
    if (y - altoFila < M + 24) nuevaPagina(false)
    if (n % 2 === 1) ops.push(`0.97 0.97 0.98 rg ${M} ${(y - altoFila + 4).toFixed(2)} ${anchoUtil} ${altoFila} re f`)
    let x = M
    columnas.forEach((c, i) => {
      const w = anchos[i]!
      const s = recortar(texto(c, fila), w - 8, tam)
      const dx = c.tipo === 'moneda' || c.tipo === 'numero' ? w - 4 - anchoTexto(s, tam) : 4
      txt(x + dx, y - 9, s)
      x += w
    })
    y -= altoFila
  })

  if (totales) {
    if (y - altoFila < M + 24) nuevaPagina(false)
    ops.push(`0.93 0.94 1 rg ${M} ${(y - altoFila + 4).toFixed(2)} ${anchoUtil} ${altoFila} re f`)
    let x = M
    totales.forEach((v, i) => {
      const w = anchos[i]!
      const c = columnas[i]
      const s = recortar(v === null ? '' : typeof v === 'number' ? (c?.tipo === 'moneda' ? moneda(v) : v.toLocaleString('es-CO')) : v, w - 8, tam, true)
      const dx = typeof v === 'number' ? w - 4 - anchoTexto(s, tam, true) : 4
      txt(x + dx, y - 9, s, tam, true)
      x += w
    })
    y -= altoFila
  }
  paginas.push(ops)

  // Pie con numeración, ahora que se conoce el total de páginas.
  paginas.forEach((p, i) => {
    const pie = `Página ${i + 1} de ${paginas.length}`
    p.push(`BT 0.5 0.52 0.58 rg /F1 8 Tf ${(W - M - anchoTexto(pie, 8)).toFixed(2)} ${M - 14} Td (${escPdf(pie)}) Tj ET`)
    p.push(`BT 0.5 0.52 0.58 rg /F1 8 Tf ${M} ${M - 14} Td (${escPdf('Portal RvR Tecnologías · Soluciones a su alcance')}) Tj ET`)
  })

  // ------------------------------------------------ ensamblado del archivo
  const objetos: string[] = []
  const agregar = (contenido: string) => {
    objetos.push(contenido)
    return objetos.length
  }
  const catalogo = agregar('')
  const raiz = agregar('')
  const f1 = agregar('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const f2 = agregar('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const kids: number[] = []
  for (const p of paginas) {
    const flujo = p.join('\n')
    const contenido = agregar(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`)
    kids.push(agregar(`<< /Type /Page /Parent ${raiz} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contenido} 0 R >>`))
  }
  objetos[catalogo - 1] = `<< /Type /Catalog /Pages ${raiz} 0 R >>`
  objetos[raiz - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`
  const info = agregar(`<< /Title (${escPdf(encabezado.titulo)}) /Producer (Portal RvR Tecnologias) >>`)

  let salida = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
  const offsets: number[] = []
  objetos.forEach((o, i) => {
    offsets.push(salida.length)
    salida += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = salida.length
  salida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  for (const o of offsets) salida += `${String(o).padStart(10, '0')} 00000 n \n`
  salida += `trailer\n<< /Size ${objetos.length + 1} /Root ${catalogo} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`

  const bytes = new Uint8Array(salida.length)
  for (let i = 0; i < salida.length; i++) bytes[i] = salida.charCodeAt(i) & 0xff
  descargar(nombre, new Blob([bytes], { type: 'application/pdf' }))
}
