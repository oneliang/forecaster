import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const apiBase = mode === 'production' ? '/api' : 'http://localhost:8484/api'
  return {
    plugins: [react()],
    server: {
      port: 8400,
      host: '0.0.0.0'
    },
    preview: {
      port: 8400,
      host: '0.0.0.0'
    },
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase)
    }
  }
})
