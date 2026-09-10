<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDatePicker, ElForm, ElFormItem, ElMessage, ElMessageBox } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useDarkMode } from '../utils/useDarkMode.js'
import { usePosts } from '../utils/blog.js'
import { createPost, updatePost, deletePost } from '../utils/editorApi.js'

const isDev = import.meta.env.DEV
const route = useRoute()
const router = useRouter()
const { isDark } = useDarkMode()
const { getBySlug } = usePosts()

const isEdit = computed(() => Boolean(route.params.slug))
const currentSlug = computed(() => String(route.params.slug || ''))
const editorTheme = computed(() => (isDark.value ? 'dark' : 'light'))

const today = new Date().toISOString().slice(0, 10)
const form = ref({
  title: '',
  slug: '',
  date: today,
  category: '',
  summary: '',
  content: '# 新文章\n\n在这里开始写作...\n',
})
const tagsText = ref('')
const saving = ref(false)

function slugFromTitle(title) {
  const normalized = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || `post-${Date.now()}`
}

function onTitleInput() {
  if (!isEdit.value) {
    form.value.slug = slugFromTitle(form.value.title)
  }
}

function parseTags(text) {
  return String(text || '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function fillFromPost() {
  const post = getBySlug(currentSlug.value)
  if (!post) {
    return
  }

  form.value = {
    title: post.title,
    slug: post.slug,
    date: post.date || today,
    category: post.category || '',
    summary: post.summary || '',
    content: post.content || '',
  }
  tagsText.value = (post.tags || []).join(', ')
}

function validate() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请填写标题')
    return false
  }

  if (!/^[A-Za-z0-9_-]+$/.test(form.value.slug)) {
    ElMessage.warning('地址 slug 只能包含字母、数字、连字符和下划线')
    return false
  }

  return true
}

function buildPayload() {
  return {
    slug: form.value.slug.trim(),
    title: form.value.title.trim(),
    date: form.value.date,
    category: form.value.category.trim() || '未分类',
    tags: parseTags(tagsText.value),
    summary: form.value.summary.trim(),
    content: form.value.content,
  }
}

async function save() {
  if (!validate()) {
    return
  }

  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await updatePost(currentSlug.value, payload)
    } else {
      await createPost(payload)
    }

    ElMessage.success('已保存')
    // 跳转详情后刷新页面，让构建期的文章扫描重新执行
    router.push(`/post/${payload.slug}`)
    window.setTimeout(() => window.location.reload(), 120)
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定删除这篇文章吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deletePost(currentSlug.value)
    ElMessage.success('已删除')
    router.push('/posts')
    window.setTimeout(() => window.location.reload(), 120)
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/posts')
  }
}

onMounted(() => {
  if (!isDev) {
    router.replace('/')
    return
  }

  if (isEdit.value) {
    fillFromPost()
  }
})
</script>

<template>
  <div v-if="isDev" class="blog-container page editor-page">
    <div class="editor-header">
      <el-button text @click="goBack">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h1>{{ isEdit ? '编辑文章' : '写文章' }}</h1>
      <div class="editor-actions">
        <el-button v-if="isEdit" type="danger" plain @click="handleDelete">删除</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </div>
    </div>

    <el-form label-position="top" class="editor-form">
      <div class="form-grid">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="文章标题" @input="onTitleInput" />
        </el-form-item>
        <el-form-item label="地址 slug">
          <el-input
            v-model="form.slug"
            :disabled="isEdit"
            placeholder="仅限字母、数字、连字符和下划线"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="例如：技术 / 随笔" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="tagsText" placeholder="用逗号分隔，例如：Vue, 前端" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="date-picker"
          />
        </el-form-item>
      </div>
      <el-form-item label="摘要">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="2"
          placeholder="列表页显示的简短摘要，可留空"
        />
      </el-form-item>
    </el-form>

    <div class="editor-body">
      <MdEditor v-model="form.content" :theme="editorTheme" :no-upload-img="true" />
    </div>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}

.editor-header h1 {
  flex: 1;
  margin: 0;
  font-size: 24px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-form {
  margin-bottom: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-grid :deep(.el-form-item:nth-child(1)) {
  grid-column: 1 / -1;
}

.date-picker {
  width: 100%;
}

.editor-body {
  height: 600px;
  min-height: 420px;
}

@media (max-width: 680px) {
  .editor-header {
    flex-wrap: wrap;
  }

  .editor-header h1 {
    order: -1;
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .editor-body {
    height: 560px;
  }
}
</style>
