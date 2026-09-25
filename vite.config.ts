import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Relative base so GitHub Pages project sites and local preview both resolve assets.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  build: {
    sourcemap: false,
    target: 'es2022',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
