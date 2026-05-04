import { defineConfig } from 'vite'

export default defineConfig({
  base: '/restaurants/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})