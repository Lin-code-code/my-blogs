<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSwitch,
} from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useAuth } from '../utils/auth.js'
import { useDarkMode } from '../utils/useDarkMode.js'
import { usePosts } from '../utils/blog.js'
import { createPost } from '../utils/editorApi.js'

const route = useRoute()
const router = useRouter()
const { isDark } = useDarkMode()
const { isStaff, loadCurrentUser } = useAuth()
const { loadPosts } = usePosts()

const form = ref({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  category: '',
  summary: '',
  draft: true,
  content: '# 新文章\n\n在这里开始写作...\n',
})
const tagsText = ref('')
const saving = ref(false)
const editorTheme = computed(() => (isDark.value ? 'dark' : 'light'))

function parseTags(text) {
  return String(text || '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function validate() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请填写标题')
    return false
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请填写正文')
    return false
  }
  return true
}

async function save() {
  if (!validate()) {
    return
  }

  saving.value = true
  try {
    const created = await createPost({
      title: form.value.title.trim(),
      date: form.value.date,
      category: form.value.category.trim() || '未分类',
      tags: parseTags(tagsText.value),
      summary: form.value.summary.trim(),
      draft: form.value.draft,
      content: form.value.content,
    })
    await loadPosts()
    ElMessage.success('文章已保存')
    router.push(`/post/${created.slug}`)
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/posts')
  }
}

onMounted(async () => {
  await loadCurrentUser()
  if (!isStaff.value) {
    router.replace({ path: '/login', query: { redirect: route.fullPath } })
  }
})
</script>

<template>
  <div class="blog-container page editor-page">
    <header class="editor-header">
      <el-button type="primary" @click="goBack">返回</el-button>
      <div class="editor-title">
        <h1>添加文章</h1>
      </div>
      <el-button type="primary" :loading="saving" @click="save">保存文章</el-button>
    </header>

    <section class="meta-panel paper-panel">
      <div class="panel-heading">
        <span class="panel-index">01</span>
        <div>
          <h2>基本信息</h2>
          <p>标题、分类、标签和摘要会用于文章列表展示。</p>
        </div>
      </div>

      <el-form label-position="top" class="meta-form">
        <div class="form-grid">
          <el-form-item label="标题" required class="full-width">
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
          <el-form-item label="状态">
            <div class="draft-row">
              <el-switch v-model="form.draft" />
              <span class="field-hint">{{ form.draft ? '保存为草稿' : '直接发布' }}</span>
            </div>
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
    </section>

    <section class="editor-shell paper-panel">
      <div class="panel-heading editor-heading">
        <span class="panel-index">02</span>
        <div>
          <h2>正文 Markdown</h2>
          <p>工具栏支持标题、列表、代码块、链接、表格和全屏预览。</p>
        </div>
      </div>
      <MdEditor
        v-model="form.content"
        class="markdown-editor"
        :theme="editorTheme"
        :no-upload-img="true"
        :show-code-row-number="true"
        :sync-scroll="true"
        preview
      />
    </section>
  </div>
</template>

<style scoped>
.editor-page {
  width: 100%;
  max-width: 1440px;
}

.editor-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.editor-title h1 {
  margin: 0 0 5px;
  font-size: 28px;
}

.editor-title p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.meta-panel {
  margin-bottom: 20px;
  padding: 22px 24px;
}

.editor-shell {
  padding: 22px 24px 24px;
}

.editor-heading {
  margin-bottom: 16px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.panel-heading h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.panel-heading p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.panel-index {
  display: inline-grid;
  flex: none;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  font-size: 12px;
  font-weight: 700;
}

.meta-form {
  margin-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1.5fr) minmax(180px, 1fr) repeat(2, minmax(150px, 0.8fr));
  gap: 0 16px;
}

.full-width {
  grid-column: 1 / -1;
}

.date-picker {
  width: 100%;
}

.draft-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.field-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.markdown-editor {
  height: calc(100vh - 390px);
  min-height: 560px;
}

@media (max-width: 1050px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .editor-header {
    grid-template-columns: 1fr auto;
  }

  .editor-title {
    order: -1;
    grid-column: 1 / -1;
  }

  .meta-panel,
  .editor-shell {
    padding: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .markdown-editor {
    height: 640px;
  }
}
</style>
