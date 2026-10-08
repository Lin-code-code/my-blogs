<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDatePicker, ElForm, ElFormItem, ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useDarkMode } from '../utils/useDarkMode.js'
import { usePosts } from '../utils/blog.js'
import {
  createPost,
  updatePost,
  deletePost,
  getPassword,
  setPassword,
} from '../utils/editorApi.js'

const isDev = import.meta.env.DEV
// 本地靠 dev server 中间件写文件；线上靠 Netlify Function 提交到仓库
const canEdit = isDev || import.meta.env.VITE_HAS_EDITOR === 'true'
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
  date: today,
  category: '',
  summary: '',
  draft: false,
  content: '# 新文章\n\n在这里开始写作...\n',
})
const tagsText = ref('')
const password = ref(getPassword())
const saving = ref(false)

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
    date: post.date || today,
    category: post.category || '',
    summary: post.summary || '',
    draft: post.draft === true,
    content: post.content || '',
  }
  tagsText.value = (post.tags || []).join(', ')
}

// 线上要凭口令才能写仓库；本地不需要
function checkPassword() {
  if (isDev) {
    return true
  }
  const value = password.value.trim()
  if (!value) {
    ElMessage.warning('请先填写编辑口令')
    return false
  }
  setPassword(value)
  return true
}

function validate() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请填写标题')
    return false
  }

  return true
}

function buildPayload() {
  return {
    title: form.value.title.trim(),
    date: form.value.date,
    category: form.value.category.trim() || '未分类',
    tags: parseTags(tagsText.value),
    summary: form.value.summary.trim(),
    draft: form.value.draft,
    content: form.value.content,
  }
}

async function save() {
  if (!validate() || !checkPassword()) {
    return
  }

  saving.value = true
  try {
    const payload = buildPayload()
    let slug = currentSlug.value
    if (isEdit.value) {
      await updatePost(currentSlug.value, payload)
    } else {
      // 文件名由服务端按秒级时间戳生成，必须用返回值才能跳转
      const created = await createPost(payload)
      slug = created.slug
    }

    if (isDev) {
      ElMessage.success('已保存')
      // 本地写完立刻刷新，让构建期的文章扫描带上新文件
      router.push(`/post/${slug}`)
      window.setTimeout(() => window.location.reload(), 120)
    } else {
      // 线上是提交到仓库，要等自动构建完成才看得到
      ElMessage.success('已提交，约 1-2 分钟后自动构建完成')
      router.push('/posts')
    }
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!checkPassword()) {
    return
  }

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
    if (isDev) {
      ElMessage.success('已删除')
      router.push('/posts')
      window.setTimeout(() => window.location.reload(), 120)
    } else {
      ElMessage.success('已提交删除，约 1-2 分钟后自动构建完成')
      router.push('/posts')
    }
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
  if (!canEdit) {
    router.replace('/')
    return
  }

  if (isEdit.value) {
    fillFromPost()
  }
})
</script>

<template>
  <div v-if="canEdit" class="blog-container page editor-page">
    <div class="editor-header">
      <el-button text @click="goBack">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h1>{{ isEdit ? '编辑文章' : '添加文章' }}</h1>
      <div class="editor-actions">
        <el-button v-if="isEdit" type="danger" plain @click="handleDelete">删除</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </div>
    </div>

    <el-form label-position="top" class="editor-form">
      <div class="form-grid">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="文章标题" />
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
        <el-form-item label="草稿">
          <el-switch v-model="form.draft" />
          <span class="field-hint">草稿不会出现在文章列表和首页</span>
        </el-form-item>
        <el-form-item v-if="!isDev" label="编辑口令">
          <el-input
            v-model="password"
            type="password"
            show-password
            placeholder="Netlify 里的 EDITOR_PASSWORD"
          />
          <span class="field-hint">保存后本机记住，不用每次输入</span>
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

    <p v-if="!isDev" class="online-note">
      线上保存 = 提交一次 Markdown 到 GitHub，站点约 1-2 分钟后自动重新构建。
    </p>

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

.field-hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.date-picker {
  width: 100%;
}

.online-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--blog-border);
  border-radius: 8px;
  background-color: var(--blog-surface);
  font-size: 13px;
  color: var(--el-text-color-secondary);
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