import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'process': path.resolve(__dirname, 'src/process-polyfill.js'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
    'global': 'globalThis',
    'process': 'window.process'
  },
  server: {
    port: 3003,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
