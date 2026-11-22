import { config } from './config.js'
import { pool } from './db.js'
import { crearApp } from './app.js'

const servidor = crearApp().listen(config.puerto, () => {
  console.log(`API de RvR escuchando en http://localhost:${config.puerto}/api`)
})

/** Cierre ordenado: sin esto, al reiniciar quedan conexiones colgadas en la base. */
for (const senal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(senal, () => {
    servidor.close(() => {
      void pool.end().then(() => process.exit(0))
    })
  })
}
