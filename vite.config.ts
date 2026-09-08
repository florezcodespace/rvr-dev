import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@app': path.resolve(rootDir, './src/app'),
      '@features': path.resolve(rootDir, './src/features'),
      '@shared': path.resolve(rootDir, './src/shared'),
    },
  },
  server: { port: 5173, open: true },
})
