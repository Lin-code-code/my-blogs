import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { blogPlugin } from './vite/blogPlugin.js'

// 默认按 GitHub Pages 的仓库路径部署；Netlify 等根路径托管用 VITE_BASE_PATH 覆盖
const base = process.env.VITE_BASE_PATH || '/my_blogs/'

export default defineConfig({
  base,
  plugins: [vue(), blogPlugin()],
})
