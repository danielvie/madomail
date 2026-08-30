// PROTOTYPE — throwaway dev server, separate from the Electron build.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const here = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url))

export default defineConfig({
  root: here,
  plugins: [tailwindcss(), react()],
  build: { outDir: repoRoot + 'dist/prototype', emptyOutDir: true },
  server: { port: 5199, open: '/?v=1' }
})
