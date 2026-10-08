<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePosts } from '../utils/blog.js'
import PostCard from '../components/PostCard.vue'

const isDev = import.meta.env.DEV
const router = useRouter()
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
  <div class="blog-container page">
    <header class="page-head posts-head">
      <div>
        <h1>全部文章</h1>
        <p class="count">共 {{ total }} 篇</p>
      </div>
      <el-button v-if="isDev" type="primary" @click="router.push('/editor')">添加文章</el-button>
    </header>

    <div class="toolbar">
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

    <PostCard v-for="p in filtered" :key="p.slug" :post="p" />
    <el-empty v-if="total === 0" description="没有符合条件的文章" />
  </div>
</template>

<style scoped>
/* 标题区改成两端对齐，右侧放「添加文章」按钮 */
.posts-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.count {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 筛选区做成一个带渐变顶线的工具条 */
.toolbar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid var(--blog-border);
  border-radius: 8px;
  background-color: var(--blog-surface);
  overflow: hidden;
}

.toolbar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-image: var(--grad-brand);
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.category-select {
  width: 160px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tags :deep(.el-check-tag) {
  border: 1px solid var(--blog-border);
  border-radius: 8px;
  background-color: var(--blog-surface);
  color: var(--el-text-color-regular);
  transition: background-image 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}

.tags :deep(.el-check-tag:hover) {
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
}

.tags :deep(.el-check-tag.is-checked) {
  border-color: transparent;
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
  font-weight: 600;
}
</style>