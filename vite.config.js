import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js загружается отдельным lazy-чанком и не блокирует первый рендер.
    chunkSizeWarningLimit: 550,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4173',
      '/uploads': 'http://localhost:4173',
    },
  },
})
