import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/chat': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/api/calendar': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/api/health': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/upload': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
