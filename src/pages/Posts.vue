<script setup>
import { ref, computed } from 'vue'
import { usePosts } from '../utils/blog.js'
import PostCard from '../components/PostCard.vue'

const { allPosts, allTags, allCategories, search } = usePosts()

const keyword = ref('')
const activeTag = ref('')
const activeCategory = ref('')

const filtered = search(allPosts, keyword, activeTag, activeCategory)
const total = computed(() => filtered.value.length)

function toggleTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>

<template>
  <div class="blog-container page posts-page">
    <header class="page-head">
      <h1>全部文章</h1>
      <p class="count">共 {{ total }} 篇</p>
    </header>

    <div class="toolbar paper-panel">
      <el-input
        v-model="keyword"
        placeholder="搜索标题 / 摘要 / 标签"
        clearable
        class="search-input"
      />
      <el-select v-model="activeCategory" placeholder="全部分类" clearable class="category-select">
        <el-option v-for="c in allCategories" :key="c" :label="c" :value="c" />
      </el-select>
    </div>

    <div class="tags" v-if="allTags.length">
      <el-check-tag
        v-for="t in allTags"
        :key="t"
        :checked="activeTag === t"
        @change="toggleTag(t)"
      >
        {{ t }}
      </el-check-tag>
    </div>

    <div v-if="total > 0" class="post-grid">
      <PostCard v-for="p in filtered" :key="p.slug" :post="p" />
    </div>
    <el-empty v-else description="没有符合条件的文章" />
  </div>
</template>

<style scoped>
.posts-page {
  max-width: var(--blog-max-width);
}

.post-grid {
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 16px;
}

.post-grid :deep(.post-card) {
  height: 100%;
  margin-bottom: 0;
}

.count {
  margin: 0;
  padding: 6px 11px;
  border: 1px solid var(--blog-border);
  border-radius: 999px;
  background: var(--blog-surface-soft);
  color: var(--blog-accent-text);
  font-size: 13px;
  font-weight: 700;
}

.toolbar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  overflow: hidden;
}

.toolbar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-image: var(--grad-brand);
}

.toolbar :deep(.el-input__wrapper),
.toolbar :deep(.el-select__wrapper) {
  border: 1px solid var(--blog-border);
  border-radius: 10px;
  background-color: var(--blog-surface-soft);
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.toolbar :deep(.el-input__wrapper.is-focus),
.toolbar :deep(.el-select__wrapper.is-focused) {
  border-color: rgba(234, 88, 12, 0.5);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.category-select {
  width: 170px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tags :deep(.el-check-tag) {
  min-height: 34px;
  padding: 6px 11px;
  border: 1px solid var(--blog-border);
  border-radius: 999px;
  background-color: var(--blog-surface-soft);
  color: var(--el-text-color-regular);
  transition: background-image 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.tags :deep(.el-check-tag:hover) {
  border-color: rgba(234, 88, 12, 0.25);
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
}

.tags :deep(.el-check-tag.is-checked) {
  border-color: transparent;
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
  font-weight: 700;
}

@media (max-width: 560px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .category-select {
    width: 100%;
  }
}
</style>