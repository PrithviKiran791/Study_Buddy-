import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/link': path.resolve(__dirname, './src/lib/next-link-shim.jsx'),
      'motion/react': path.resolve(__dirname, './node_modules/framer-motion'),
      'motion': path.resolve(__dirname, './node_modules/framer-motion'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react'
            }
            if (
              id.includes('framer-motion') ||
              id.includes('motion') ||
              id.includes('gsap')
            ) {
              return 'vendor-animation'
            }
            if (
              id.includes('react-markdown') ||
              id.includes('rehype') ||
              id.includes('remark') ||
              id.includes('highlight.js') ||
              id.includes('micromark') ||
              id.includes('unist') ||
              id.includes('vfile')
            ) {
              return 'vendor-markdown'
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts'
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'vendor-ui'
            }
          }
        },
      },
    },
  },
})
