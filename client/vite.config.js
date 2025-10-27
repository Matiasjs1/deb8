import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Optimizaciones para reducir el tamaño del bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Code splitting mejorado
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'form-vendor': ['react-hook-form'],
          'utils': ['axios', 'js-cookie']
        },
        // Optimizar nombres de archivos para mejor caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Optimizar el tamaño de los chunks
    chunkSizeWarningLimit: 1000,
    // Source maps para debugging (opcional en producción)
    sourcemap: false,
    // Compresión CSS
    cssCodeSplit: true,
    // Optimizar assets
    assetsInlineLimit: 4096, // Inline assets menores a 4kb
    // Reportar tamaño comprimido
    reportCompressedSize: true
  }
})