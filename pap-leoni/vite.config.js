import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // accessible depuis le téléphone
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.14:8080',
        changeOrigin: true,
      }
    }
  },
})