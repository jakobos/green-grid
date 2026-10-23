import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/green-grid/',
  plugins: [react()],
  resolve: {
    alias: [
      // Vitest resolves konva's Node entry (needs the native `canvas` package); force the browser build.
      { find: /^konva$/, replacement: new URL('./node_modules/konva/lib/index.js', import.meta.url).pathname },
      { find: '@', replacement: new URL('./src', import.meta.url).pathname },
    ],
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})
