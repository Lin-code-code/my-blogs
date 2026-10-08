<script setup>
import { computed, ref } from 'vue'
import { usePosts } from '../utils/blog.js'
import PostCard from '../components/PostCard.vue'

const { allPosts, allTags, allCategories, search } = usePosts()

const keyword = ref('')
const activeTag = ref('')
const activeCategory = ref('')

const filtered = search(allPosts, keyword, activeTag, activeCategory)
const total = computed(() => filtered.value.length)
const hasFilters = computed(
  () => Boolean(keyword.value.trim() || activeTag.value || activeCategory.value)
)

function toggleTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}

function clearFilters() {
  keyword.value = ''
  activeTag.value = ''
  activeCategory.value = ''
}
</script>

<template>
  <div class="blog-container page posts-page">
    <header class="page-head">
      <div>
        <h1>全部文章</h1>
        <p class="page-desc">按关键词、分类或标签筛选文章。</p>
      </div>
    </header>

    <div class="posts-shell paper-panel">
      <aside class="filter-panel" aria-label="文章筛选">
        <div class="filter-heading">
          <span class="filter-kicker">Filter</span>
          <h2>搜索与筛选</h2>
          <p>默认显示全部文章。</p>
        </div>

        <el-input
          v-model="keyword"
          placeholder="搜索标题 / 摘要 / 标签"
          clearable
          class="search-input"
        />

        <el-select v-model="activeCategory" placeholder="全部分类" clearable class="category-select">
          <el-option v-for="c in allCategories" :key="c" :label="c" :value="c" />
        </el-select>

        <template v-if="allTags.length">
          <div class="filter-divider"></div>
          <div class="tag-section">
            <h3>标签</h3>
            <div class="tags">
              <el-check-tag
                v-for="t in allTags"
                :key="t"
                :checked="activeTag === t"
                @change="toggleTag(t)"
              >
                {{ t }}
              </el-check-tag>
            </div>
          </div>
        </template>
      </aside>

      <section class="post-results" aria-label="文章列表">
        <div class="results-head">
          <span class="count">共 {{ total }} 篇</span>
          <button v-if="hasFilters" type="button" class="clear-button" @click="clearFilters">
            清除筛选
          </button>
        </div>

        <div v-if="total > 0" class="post-grid">
          <PostCard v-for="p in filtered" :key="p.slug" :post="p" />
        </div>
        <el-empty v-else description="没有符合条件的文章" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.posts-page {
  max-width: var(--blog-max-width);
}

.page-desc {
  margin: 10px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.posts-shell {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  align-items: stretch;
  min-height: 560px;
  overflow: hidden;
}

.filter-panel {
  padding: 26px 22px;
  border-right: 1px solid var(--blog-border);
  background:
    linear-gradient(180deg, var(--blog-surface-soft), var(--blog-surface)),
    var(--blog-surface);
}

.filter-kicker {
  display: block;
  margin-bottom: 5px;
  color: var(--blog-accent-text);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filter-heading h2 {
  margin: 0 0 5px;
  font-size: 21px;
}

.filter-heading p {
  margin: 0 0 20px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.filter-panel :deep(.el-input__wrapper),
.filter-panel :deep(.el-select__wrapper) {
  border: 1px solid var(--blog-border);
  border-radius: 10px;
  background-color: var(--blog-surface-soft);
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-panel :deep(.el-input__wrapper.is-focus),
.filter-panel :deep(.el-select__wrapper.is-focused) {
  border-color: rgba(234, 88, 12, 0.5);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.search-input,
.category-select {
  width: 100%;
}

.category-select {
  margin-top: 12px;
}

.filter-divider {
  height: 1px;
  margin: 22px 0;
  background-color: var(--blog-border);
}

.tag-section h3 {
  margin: 0 0 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 700;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.post-results {
  min-width: 0;
  padding: 26px 24px 30px;
  background:
    radial-gradient(circle at 100% 0%, rgba(249, 115, 22, 0.08), transparent 34%),
    var(--blog-surface);
}

.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--blog-border);
}

.count {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 5px 11px;
  border: 1px solid var(--blog-border);
  border-radius: 999px;
  background: var(--blog-surface-soft);
  color: var(--blog-accent-text);
  font-size: 13px;
  font-weight: 700;
}

.clear-button {
  border: 0;
  background: transparent;
  color: var(--blog-accent-text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.clear-button:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
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

@media (max-width: 820px) {
  .posts-shell {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .filter-panel {
    border-right: 0;
    border-bottom: 1px solid var(--blog-border);
    padding: 22px 20px;
  }

  .post-results {
    padding: 22px 20px 26px;
  }
}

@media (max-width: 560px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
