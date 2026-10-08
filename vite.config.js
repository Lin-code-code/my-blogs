import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const base = process.env.VITE_BASE_PATH || '/my-blogs/'

export default defineConfig({
  base,
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
