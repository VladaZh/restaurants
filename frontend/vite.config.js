import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.CI_GITHUB_ACTIONS ? '/restaurants/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        firenze: resolve(__dirname, 'firenze.html'),
        roma: resolve(__dirname, 'roma.html'),
      },
    },
    outDir: 'dist',
    assetsDir: 'assets'
  }
})