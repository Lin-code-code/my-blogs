<script setup>
import { usePosts } from '../utils/blog.js'
import PostCard from '../components/PostCard.vue'

const { latest } = usePosts()
const latestPosts = latest(5)
</script>

<template>
  <div>
    <section class="hero">
      <div class="blog-container hero-inner">
        <h1>我的博客</h1>
        <p class="hero-desc">记录技术、学习与生活。</p>
      </div>
    </section>

    <section class="blog-container page">
      <div class="section-header">
        <h2>最新文章</h2>
        <router-link to="/posts" class="more">全部文章 →</router-link>
      </div>
      <PostCard v-for="p in latestPosts" :key="p.slug" :post="p" />
      <el-empty v-if="latestPosts.length === 0" description="还没有文章" />
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
}

/* 顶部叠一层柔和高光，让纯渐变有一点纵深 */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 62%);
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 1;
  padding-top: 46px;
  padding-bottom: 50px;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  font-size: 15px;
  color: rgba(63, 17, 22, 0.78);
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h2 {
  position: relative;
  margin: 0;
  padding-left: 14px;
  font-size: 20px;
}

.section-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.22em;
  bottom: 0.22em;
  width: 4px;
  border-radius: 2px;
  background: var(--grad-brand);
}

.more {
  font-size: 14px;
  color: var(--blog-accent-text);
  text-decoration: none;
}

.more:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 480px) {
  .hero-inner {
    padding-top: 34px;
    padding-bottom: 38px;
  }

  .hero h1 {
    font-size: 26px;
  }
}
</style>
