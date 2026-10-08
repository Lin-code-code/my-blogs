<script setup>
import { computed } from 'vue'
import { usePosts } from '../utils/blog.js'
import PostCard from '../components/PostCard.vue'

const { allPosts, allCategories, allTags, latest } = usePosts()
const latestPosts = latest(5)
const articleCount = computed(() => allPosts.value.length)
const categoryCount = computed(() => allCategories.value.length)
const tagCount = computed(() => allTags.value.length)
</script>

<template>
  <div>
    <section class="hero">
      <div class="blog-container hero-inner">
        <div class="hero-copy">
          <span class="hero-eyebrow">Warm Editorial Notes</span>
          <h1>我的博客</h1>
          <p class="hero-desc">记录技术、学习与生活。</p>
        </div>
        <div class="hero-stats" aria-label="博客统计">
          <div class="stat-card">
            <strong>{{ articleCount }}</strong>
            <span>文章</span>
          </div>
          <div class="stat-card">
            <strong>{{ categoryCount }}</strong>
            <span>分类</span>
          </div>
          <div class="stat-card">
            <strong>{{ tagCount }}</strong>
            <span>标签</span>
          </div>
        </div>
      </div>
    </section>

    <section class="blog-container page home-page">
      <div class="section-header">
        <div>
          <span class="section-kicker">Latest Notes</span>
          <h2>最新文章</h2>
        </div>
        <router-link to="/posts" class="more">全部文章 →</router-link>
      </div>
      <div class="home-post-list">
        <PostCard v-for="p in latestPosts" :key="p.slug" :post="p" />
      </div>
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

.hero::before {
  content: '';
  position: absolute;
  inset: -30% -10% auto auto;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  filter: blur(8px);
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding-top: 58px;
  padding-bottom: 62px;
}

.hero-copy {
  max-width: 520px;
}

.hero-eyebrow,
.section-kicker {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-eyebrow {
  color: rgba(63, 17, 22, 0.66);
}

.hero h1 {
  margin: 0 0 12px;
  font-size: 38px;
  line-height: 1.12;
}

.hero-desc {
  margin: 0;
  font-size: 16px;
  color: rgba(63, 17, 22, 0.78);
}

.hero-stats {
  display: flex;
  gap: 10px;
  flex: none;
}

.stat-card {
  display: grid;
  min-width: 78px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  color: var(--blog-on-brand);
  text-align: center;
}

.stat-card strong {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
}

.stat-card span {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.76;
}

.home-page {
  padding-top: 40px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-kicker {
  color: var(--blog-accent-text);
}

.section-header h2 {
  position: relative;
  margin: 0;
  padding-left: 14px;
  font-size: 25px;
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
  color: var(--blog-accent-text);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.more:hover {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.home-post-list {
  display: grid;
  gap: 16px;
}

@media (max-width: 720px) {
  .hero-inner {
    align-items: stretch;
    flex-direction: column;
    padding-top: 40px;
    padding-bottom: 42px;
  }

  .hero h1 {
    font-size: 30px;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stat-card {
    min-width: 0;
  }
}
</style>
