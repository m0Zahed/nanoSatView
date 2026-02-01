import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['nanosatview.com', 'www.nanosatview.com', '54.234.130.176'],
  },
  preview: {
    allowedHosts: ['nanosatview.com', 'www.nanosatview.com', '54.234.130.176'],
  },
})
