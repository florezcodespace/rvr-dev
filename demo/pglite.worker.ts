/**
 * Base de demostración en un Web Worker compartido por todas las pestañas
 * (PGliteWorker elige una pestaña líder y las demás le envían sus consultas):
 * así dos pestañas abiertas ven y guardan exactamente los mismos datos.
 */
import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'
import esquema from '../db/01-esquema.sql?raw'
import catalogos from '../db/02-catalogos.sql?raw'
import demo from '../db/99-datos-demo.sql?raw'

interface Meta {
  zona: string
  nombre: string
  reiniciar: boolean
}

function borrar(nombre: string) {
  return new Promise<void>((resolver) => {
    const r = indexedDB.deleteDatabase(`/pglite/${nombre}`)
    r.onsuccess = r.onerror = r.onblocked = () => resolver()
  })
}

async function abrir(dataDir: string | undefined, zona: string) {
  // Guardar en IndexedDB sin esperar a cada consulta: la demo responde antes.
  const db = await PGlite.create(dataDir, { relaxedDurability: true })
  await db.exec(`SET TimeZone = '${zona.replace(/'/g, '')}'`)
  const { rows } = await db.query<{ lista: boolean }>(`SELECT to_regclass('public.usuario') IS NOT NULL AS lista`)
  if (!rows[0]?.lista) {
    const t = performance.now()
    await db.exec(esquema)
    await db.exec(catalogos)
    await db.exec(demo)
    console.info(`[demo] base de demostración creada en ${Math.round(performance.now() - t)} ms`)
  }
  return db
}

// Error inofensivo del sistema de archivos de PGlite al guardar una base nueva.
for (const evento of ['error', 'unhandledrejection'] as const) {
  self.addEventListener(evento, (e) => {
    const causa = (e as ErrorEvent).error ?? (e as PromiseRejectionEvent).reason
    if ((causa as { name?: string } | undefined)?.name === 'ErrnoError') e.preventDefault()
  })
}

worker({
  async init(opciones) {
    const meta = opciones.meta as Meta
    if (meta.reiniciar) await borrar(meta.nombre)
    try {
      return await abrir(`idb://${meta.nombre}`, meta.zona)
    } catch (error) {
      // Navegación privada o IndexedDB bloqueado: la base vive solo en memoria.
      console.warn('[demo] sin IndexedDB, la base de demostración vive en memoria', error)
      return abrir(undefined, meta.zona)
    }
  },
})
