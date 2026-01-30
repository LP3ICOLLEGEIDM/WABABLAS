import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
  },
  optimizeDeps: {
    exclude: ['bufferutil', 'utf-8-validate']
  },
  plugins: [
    react(),
    electron({
      entry: 'electron/main.ts',
      vite: {
        build: {
          rollupOptions: {
            external: ['bufferutil', 'utf-8-validate'],
          },
        },
      },
    }),
    renderer(),
  ],
})
