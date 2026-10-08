<script setup>
import { useRoute } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useDarkMode } from '../utils/useDarkMode.js'

const route = useRoute()
const { isDark, toggle } = useDarkMode()
// 本地 dev server 有写文章中间件；线上只有配了 VITE_HAS_EDITOR 的环境才有写后端
const canEdit = import.meta.env.DEV || import.meta.env.VITE_HAS_EDITOR === 'true'

const menus = [
  { path: '/', label: '首页' },
  { path: '/posts', label: '文章' },
  { path: '/about', label: '关于' },
]
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="blog-container header-inner">
        <router-link to="/" class="site-name">我的博客</router-link>
        <nav class="nav">
          <router-link
            v-for="m in menus"
            :key="m.path"
            :to="m.path"
            class="nav-item"
            :class="{ active: route.path === m.path || (m.path === '/posts' && route.path.startsWith('/post')) }"
          >
            {{ m.label }}
          </router-link>
          <router-link v-if="canEdit" to="/editor" class="nav-item" :class="{ active: route.path.startsWith('/editor') }">
            写文章
          </router-link>
          <el-tooltip :content="isDark ? '切换到浅色' : '切换到深色'" placement="bottom">
            <el-button text circle class="theme-toggle" @click="toggle">
              <el-icon><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
            </el-button>
          </el-tooltip>
        </nav>
      </div>
    </header>

    <main class="main">
      <slot />
    </main>

    <footer class="footer">
      <div class="blog-container footer-inner">
        <span>Powered by</span>
        <span class="footer-brand">Vue 3 + Vite</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--blog-header-bg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* 顶栏底部的渐变细线，作为整站的主题线索 */
.header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--grad-brand);
  opacity: 0.75;
  pointer-events: none;
}

.header-inner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.site-name {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
  background-image: var(--grad-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.site-name::before {
  content: '';
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background-image: var(--grad-brand);
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  padding: 7px 13px;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  font-size: 14px;
  transition: background-image 0.25s ease, color 0.25s ease;
}

.nav-item:hover,
.nav-item.active {
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
}

.nav-item.active {
  font-weight: 600;
}

.theme-toggle {
  margin-left: 4px;
  background-image: var(--grad-brand-soft);
}

.theme-toggle:hover {
  color: var(--blog-accent-text);
}

.main {
  flex: 1;
  width: 100%;
}

.footer {
  position: relative;
  padding: 26px 0;
  border-top: 1px solid var(--blog-border);
}

.footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: min(360px, 60%);
  height: 2px;
  border-radius: 2px;
  background: var(--grad-brand);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.footer-brand {
  font-weight: 600;
  background-image: var(--grad-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@media (max-width: 480px) {
  .header-inner {
    height: 56px;
  }

  .site-name {
    font-size: 16px;
  }

  .nav {
    gap: 2px;
  }

  .nav-item {
    padding: 6px 9px;
    font-size: 13px;
  }
}
</style>
