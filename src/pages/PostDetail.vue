<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePosts } from '../utils/blog.js'
import { deletePost } from '../utils/editorApi.js'

const isDev = import.meta.env.DEV
const route = useRoute()
const router = useRouter()
const { getBySlug, neighbors, render } = usePosts()

const post = computed(() => getBySlug(route.params.slug))
const html = computed(() => (post.value ? render(post.value.content) : ''))
const nav = computed(() => neighbors(route.params.slug))
const deleting = ref(false)

// 删除当前文章，仅本地开发环境可用
async function handleDelete() {
  if (!post.value) {
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除《${post.value.title}》吗？删除后无法恢复。`, '删除文章', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deletePost(post.value.slug)
    ElMessage.success('已删除')
    router.push('/posts')
    // 刷新页面让构建期的文章扫描重新执行
    window.setTimeout(() => window.location.reload(), 120)
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="blog-container page">
    <template v-if="post">
      <article>
        <h1 class="title">{{ post.title }}</h1>
        <div class="meta post-tags">
          <span class="date">{{ post.date }}</span>
          <el-tag v-if="post.category" size="small" type="info">{{ post.category }}</el-tag>
          <el-tag v-for="t in post.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
          <el-button
            v-if="isDev"
            class="delete-btn"
            type="danger"
            text
            :loading="deleting"
            @click="handleDelete"
          >
            <el-icon><Delete /></el-icon>
            删除文章
          </el-button>
        </div>
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
.title {
  position: relative;
  margin: 0 0 14px;
  padding-bottom: 14px;
  font-size: 27px;
}

.title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 56px;
  height: 3px;
  border-radius: 2px;
  background: var(--grad-brand);
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 26px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
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

.delete-btn {
  margin-left: auto;
}

.pager {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--blog-border);
}

.pager-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 46%;
  padding: 9px 14px;
  border: 1px solid var(--blog-border);
  border-radius: 8px;
  background-color: var(--blog-surface);
  color: var(--blog-accent-text);
  text-decoration: none;
  font-size: 14px;
  transition: background-image 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.pager-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pager-link:hover {
  border-color: transparent;
  background-image: var(--grad-brand-soft);
  transform: translateY(-1px);
}

.pager-link.next {
  margin-left: auto;
}

/* 窄屏竖排，避免文章标题被省略号截断 */
@media (max-width: 560px) {
  .delete-btn {
    margin-left: 0;
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
