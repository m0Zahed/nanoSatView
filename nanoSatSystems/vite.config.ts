import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const devFlag = String(rootEnv.DEV || '').trim().toLowerCase()
  const isProjectDevEnabled = devFlag === 'true' || devFlag === '1' || devFlag === 'yes' || devFlag === 'on'

  return {
    envPrefix: ['VITE_', 'TESTING_'],
    define: {
      __APP_DEV_ENABLED__: JSON.stringify(isProjectDevEnabled),
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      allowedHosts: ['nanosatview.com', 'www.nanosatview.com', '54.234.130.176'],
      proxy: {
        '/api/monitoring': {
          target: 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
        '/api/diagrams': {
          target: 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
    preview: {
      allowedHosts: ['nanosatview.com', 'www.nanosatview.com', '54.234.130.176'],
    },
  }
})
