import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          spline: ['@splinetool/runtime'],
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          animation: ['gsap', 'lenis', 'framer-motion'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/drei', '@react-three/fiber', 'gsap', 'lenis'],
  },
})
