import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const demo = (archivo: string) => path.resolve(rootDir, 'demo', archivo)
const apiDir = path.resolve(rootDir, 'api/src')

/** La API importa `./modulo.js` (estilo Node); en el navegador son sus `.ts`. */
const importacionesDeLaApi: Plugin = {
  name: 'rvr-api-ts',
  enforce: 'pre',
  resolveId(fuente, importador) {
    if (!importador?.startsWith(apiDir) || !/^\.{1,2}\/.*\.js$/.test(fuente)) return null
    return path.resolve(path.dirname(importador), fuente.replace(/\.js$/, '.ts'))
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_')
  /**
   * Modo demostración (`vite build --mode demo` o VITE_DEMO=1): la API corre
   * dentro del navegador sobre PGlite. Es lo que se publica en Vercel para
   * revisar el portal sin servidor ni base de datos.
   */
  const esDemo = mode === 'demo' || env.VITE_DEMO === '1' || process.env.VITE_DEMO === '1'

  return {
    plugins: [importacionesDeLaApi, react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_DEMO': JSON.stringify(esDemo ? '1' : ''),
      // La API lee process.env; en el navegador lo llena demo/servidor.ts
      ...(esDemo ? { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'), 'process.env': 'globalThis.__rvrEnv' } : {}),
    },
    resolve: {
      // Zod y bcryptjs de la API y del portal son el mismo paquete
      dedupe: ['zod', 'bcryptjs'],
      alias: [
        { find: '@app', replacement: path.resolve(rootDir, './src/app') },
        { find: '@features', replacement: path.resolve(rootDir, './src/features') },
        { find: '@shared', replacement: path.resolve(rootDir, './src/shared') },
        { find: /^@\//, replacement: `${path.resolve(rootDir, './src')}/` },
        // La API de `api/src` en el navegador (solo se empaqueta en modo demo)
        { find: 'virtual:rvr-demo', replacement: demo(esDemo ? 'servidor.ts' : 'apagado.ts') },
        { find: /^express$/, replacement: demo('shims/express.ts') },
        { find: /^pg$/, replacement: demo('shims/pg.ts') },
        { find: /^(node:)?crypto$/, replacement: demo('shims/crypto.ts') },
        { find: /^jsonwebtoken$/, replacement: demo('shims/jsonwebtoken.ts') },
        { find: /^(nodemailer|cors|dotenv\/config)$/, replacement: demo('shims/vacio.ts') },
      ],
    },
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
    worker: { format: 'es' },
    build: { chunkSizeWarningLimit: 900 },
    server: { port: 5173, open: !esDemo },
  }
})
