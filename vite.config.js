import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ブラウザからの /api/... へのリクエストをAIサーバー(3001)に中継する
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
