<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuth } from '../utils/auth.js'
import { postTimeLabel, usePosts } from '../utils/blog.js'
import { deletePost } from '../utils/editorApi.js'

const route = useRoute()
const router = useRouter()
const { isStaff, loadCurrentUser } = useAuth()
const { allPosts, loadPosts } = usePosts()
const loading = ref(true)

async function remove(post) {
  try {
    await ElMessageBox.confirm(`确定删除《${post.title}》？数据库里的记录会直接删除，无法恢复。`, '删除文章', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deletePost(post.slug)
    await loadPosts()
    ElMessage.success('文章已删除')
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

onMounted(async () => {
  await loadCurrentUser()
  if (!isStaff.value) {
    router.replace({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  await loadPosts()
  loading.value = false
})
</script>

<template>
  <div class="blog-container page manage-page">
    <header class="page-head">
      <div>
        <h1>文章管理</h1>
        <p class="page-desc">这里只显示已发布文章，可以继续编辑或直接删除。</p>
      </div>
    </header>

    <div v-if="loading" class="loading">正在加载文章...</div>
    <el-empty v-else-if="allPosts.length === 0" description="还没有已发布文章" />

    <div v-else class="manage-list">
      <article v-for="post in allPosts" :key="post.slug" class="manage-card paper-panel">
        <div class="manage-main">
          <div class="manage-meta">
            <span>{{ post.date }}</span>
            <el-tag size="small" type="info">{{ post.category || '未分类' }}</el-tag>
          </div>
          <h2>{{ post.title }}</h2>
          <span class="stamp">{{ postTimeLabel(post) }}</span>
        </div>
        <div class="manage-actions">
          <router-link class="action-link" :to="{ path: '/editor', query: { slug: post.slug } }">
            编辑
          </router-link>
          <button type="button" class="action-link danger" @click="remove(post)">删除</button>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.manage-page {
  max-width: 820px;
}

.page-desc {
  margin: 10px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading {
  padding: 28px 0;
  color: var(--el-text-color-secondary);
}

.manage-list {
  display: grid;
  gap: 14px;
}

.manage-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.manage-card:hover {
  box-shadow: 0 14px 32px rgba(90, 30, 20, 0.1);
  transform: translateY(-2px);
}

.manage-main {
  min-width: 0;
  flex: 1;
}

.manage-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.manage-card h2 {
  margin: 8px 0 6px;
  font-size: 18px;
}

.stamp {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.manage-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.action-link {
  padding: 8px 13px;
  border: 0;
  border-radius: 8px;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.action-link:hover {
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
}

.action-link.danger {
  background-image: none;
  background-color: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
}

.action-link.danger:hover {
  background-color: var(--el-color-danger);
  color: #fff;
}

@media (max-width: 560px) {
  .manage-card {
    align-items: stretch;
    flex-direction: column;
  }

  .action-link {
    flex: 1;
    text-align: center;
  }
}
</style>