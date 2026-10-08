<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '../utils/auth.js'
import { listDrafts } from '../utils/editorApi.js'

const route = useRoute()
const router = useRouter()
const { isStaff, loadCurrentUser } = useAuth()
const drafts = ref([])
const loading = ref(true)
const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function editUrl(draft) {
  return `${apiBase}/admin/blog/post/${draft.id}/change/`
}

function formatDate(value) {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

onMounted(async () => {
  await loadCurrentUser()
  if (!isStaff.value) {
    router.replace({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  try {
    drafts.value = await listDrafts()
  } catch (error) {
    ElMessage.error(error.message || '草稿加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="blog-container page drafts-page">
    <header class="page-head">
      <h1>草稿箱</h1>
      <p>这里只显示未发布文章，点击“继续编辑”进入后台编辑。</p>
    </header>

    <div v-if="loading" class="loading">正在加载草稿...</div>
    <el-empty v-else-if="drafts.length === 0" description="暂无草稿" />

    <div v-else class="draft-list">
      <article v-for="draft in drafts" :key="draft.id" class="draft-card">
        <div class="draft-main">
          <div class="draft-meta">
            <span>{{ draft.date }}</span>
            <el-tag size="small" type="info">{{ draft.category || '未分类' }}</el-tag>
          </div>
          <h2>{{ draft.title }}</h2>
          <p>{{ draft.summary || '暂无摘要' }}</p>
          <span class="updated">最后更新：{{ formatDate(draft.updated_at) }}</span>
        </div>
        <a :href="editUrl(draft)" target="_blank" rel="noopener" class="edit-link">继续编辑</a>
      </article>
    </div>
  </div>
</template>

<style scoped>
.drafts-page {
  max-width: 820px;
}

.page-head p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading {
  padding: 28px 0;
  color: var(--el-text-color-secondary);
}

.draft-list {
  display: grid;
  gap: 14px;
}

.draft-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--blog-border);
  border-radius: 12px;
  background-color: var(--blog-surface);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.draft-main {
  min-width: 0;
  flex: 1;
}

.draft-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.draft-card h2 {
  margin: 8px 0 6px;
  font-size: 18px;
}

.draft-card p {
  margin: 0 0 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.6;
}

.updated {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.edit-link {
  flex: none;
  padding: 8px 13px;
  border-radius: 8px;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.edit-link:hover {
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
}

@media (max-width: 560px) {
  .draft-card {
    align-items: stretch;
    flex-direction: column;
  }

  .edit-link {
    text-align: center;
  }
}
</style>
