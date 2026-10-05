import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5180 },
  build: { assetsInlineLimit: 2_000_000, chunkSizeWarningLimit: 1500 },
})
