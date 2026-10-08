import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../pages/Home.vue') },
  { path: '/posts', name: 'posts', component: () => import('../pages/Posts.vue') },
  { path: '/post/:slug', name: 'post-detail', component: () => import('../pages/PostDetail.vue') },
  { path: '/about', name: 'about', component: () => import('../pages/About.vue') },
]

// 使用 hash 模式，静态托管（如 GitHub Pages）无需服务端路由配置
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 切换页面后回到顶部，避免详情页跳转时停留在上一页的滚动位置
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
