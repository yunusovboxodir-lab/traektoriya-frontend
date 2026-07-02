import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Path alias '@/...' → 'src/...' (Phase 0, для shadcn/ui и новых компонентов)
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // PORT из окружения — чтобы параллельные dev-серверы (Claude Preview) не дрались за 5173
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    proxy: {
      '/api': {
        target: 'https://api.traektoriya.space',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['axios', 'zustand'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
})
