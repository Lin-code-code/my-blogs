<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Moon, Sunny, UserFilled } from '@element-plus/icons-vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { useAuth } from '../utils/auth.js'
import { useDarkMode } from '../utils/useDarkMode.js'

const route = useRoute()
const router = useRouter()
const { isDark, toggle } = useDarkMode()
const { currentUser, isAuthenticated, isStaff, loadCurrentUser, logout } = useAuth()

onMounted(loadCurrentUser)

async function handleLogout() {
  try {
    await logout()
  } finally {
    router.push('/')
  }
}

function handleCreateCommand(command) {
  if (command === 'new') {
    router.push('/editor')
    return
  }
  if (command === 'drafts') {
    router.push('/drafts')
  }
}

async function handleAccountCommand(command) {
  if (command === 'account') {
    router.push('/account')
    return
  }
  if (command === 'logout') {
    await handleLogout()
  }
}
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
          <el-dropdown
            v-if="isStaff"
            trigger="click"
            placement="bottom-end"
            @command="handleCreateCommand"
          >
            <button
              type="button"
              class="nav-item nav-dropdown-button"
              :class="{ active: route.path.startsWith('/editor') || route.path === '/drafts' }"
              aria-label="创作菜单"
              aria-haspopup="menu"
            >
              创作
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="new">新增文章</el-dropdown-item>
                <el-dropdown-item command="drafts">草稿箱</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown
            v-if="isAuthenticated"
            trigger="click"
            placement="bottom-end"
            @command="handleAccountCommand"
          >
            <button
              type="button"
              class="account-trigger"
              :aria-label="`账号菜单：${currentUser.username}`"
              aria-haspopup="menu"
            >
              <el-icon><UserFilled /></el-icon>
              <span class="account-name">{{ currentUser.username }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="account">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <router-link v-else to="/login" class="nav-item" :class="{ active: route.path === '/login' }">
            登录
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
  z-index: 20;
  background: var(--blog-header-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--grad-brand);
  opacity: 0.8;
  pointer-events: none;
}

.header-inner {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.site-name {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-decoration: none;
  background-image: var(--grad-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.site-name::before {
  content: '';
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 5px;
  background-image: var(--grad-brand);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.32);
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item {
  position: relative;
  padding: 8px 13px;
  border-radius: 10px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background-image 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-item::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 3px;
  height: 2px;
  border-radius: 2px;
  background: var(--grad-brand);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-item:hover,
.nav-item.active {
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
}

.nav-item:hover::after,
.nav-item.active::after {
  opacity: 1;
}

.nav-item.active {
  font-weight: 700;
}

.nav-dropdown-button {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}

.account-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  min-width: 44px;
  padding: 7px 12px;
  border: 1px solid rgba(234, 88, 12, 0.16);
  border-radius: 999px;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.1);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.account-trigger:hover {
  border-color: rgba(234, 88, 12, 0.3);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.16);
  transform: translateY(-1px);
}

.account-trigger:active {
  transform: translateY(0);
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
  display: flex;
  flex-direction: column;
}

.footer {
  position: relative;
  padding: 30px 0;
  border-top: 1px solid var(--blog-border);
}

.footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, 64%);
  height: 2px;
  border-radius: 2px;
  background: var(--grad-brand);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.footer-brand {
  font-weight: 700;
  background-image: var(--grad-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@media (max-width: 680px) {
  .header-inner {
    height: 58px;
  }

  .site-name {
    font-size: 17px;
  }

  .nav {
    gap: 2px;
  }

  .nav-item {
    padding: 7px 9px;
    font-size: 13px;
  }

  .nav-item::after {
    left: 10px;
    right: 10px;
  }

  .account-name {
    display: none;
  }

  .account-trigger {
    padding: 6px 10px;
  }
}
</style>
