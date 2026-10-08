<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { usePosts } from '../utils/blog.js'

const route = useRoute()
const { getBySlug, neighbors, render } = usePosts()

const post = computed(() => getBySlug(route.params.slug))
const html = computed(() => (post.value ? render(post.value.content) : ''))
const nav = computed(() => neighbors(route.params.slug))

</script>

<template>
  <div class="blog-container page post-detail-page">
    <template v-if="post">
      <article class="article-shell paper-panel">
        <header class="article-header">
          <span class="article-kicker">Article</span>
          <h1 class="title">{{ post.title }}</h1>
          <div class="meta post-tags">
            <span class="date">{{ post.date }}</span>
            <el-tag v-if="post.category" size="small" type="info">{{ post.category }}</el-tag>
            <el-tag v-for="t in post.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
          </div>
        </header>
        <div class="markdown-body" v-html="html"></div>
      </article>

      <nav class="pager">
        <router-link v-if="nav.next" :to="`/post/${nav.next.slug}`" class="pager-link">
          <el-icon><ArrowLeft /></el-icon><span>{{ nav.next.title }}</span>
        </router-link>
        <span v-else />
        <router-link v-if="nav.prev" :to="`/post/${nav.prev.slug}`" class="pager-link next">
          <span>{{ nav.prev.title }}</span><el-icon><ArrowRight /></el-icon>
        </router-link>
      </nav>
    </template>

    <el-result v-else icon="warning" title="文章不存在">
      <template #extra>
        <router-link to="/posts"><el-button type="primary">返回文章列表</el-button></router-link>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.post-detail-page {
  max-width: var(--blog-max-width);
}

.article-shell {
  padding: 38px 42px 42px;
}

.article-kicker {
  display: block;
  margin-bottom: 10px;
  color: var(--blog-accent-text);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.title {
  position: relative;
  margin: 0 0 18px;
  padding-bottom: 16px;
  font-size: 34px;
  line-height: 1.25;
}

.title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 64px;
  height: 3px;
  border-radius: 2px;
  background: var(--grad-brand);
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 30px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.date::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 7px;
  border-radius: 50%;
  background-image: var(--grad-brand);
  vertical-align: 1px;
}

.pager {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
  padding-top: 0;
  border-top: 0;
}

.pager-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 46%;
  padding: 12px 16px;
  border: 1px solid var(--blog-border);
  border-radius: var(--radius-md);
  background: var(--blog-surface-soft);
  color: var(--blog-accent-text);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: background-image 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.pager-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pager-link:hover {
  border-color: transparent;
  background-image: var(--grad-brand-soft);
  transform: translateY(-2px);
}

.pager-link.next {
  margin-left: auto;
}

@media (max-width: 680px) {
  .article-shell {
    padding: 26px 22px 30px;
  }

  .title {
    font-size: 28px;
  }

  .pager {
    flex-direction: column;
    align-items: stretch;
  }

  .pager-link,
  .pager-link.next {
    max-width: 100%;
    margin-left: 0;
  }

  .pager-link.next {
    justify-content: flex-end;
  }
}
</style>

