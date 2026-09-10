import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { blogPlugin } from './vite/blogPlugin.js'

// base 需要与 GitHub Pages 仓库名一致，换平台时改这里
export default defineConfig({
  base: '/my_blogs/',
  plugins: [vue(), blogPlugin()],
})
