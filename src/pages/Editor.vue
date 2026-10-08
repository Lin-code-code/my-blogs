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
import { useAuth } from '../utils/auth.js'
import { usePosts } from '../utils/blog.js'
import { createPost } from '../utils/editorApi.js'

const route = useRoute()
const router = useRouter()
const { isStaff, loadCurrentUser } = useAuth()
const { loadPosts, render } = usePosts()

const form = ref({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  category: '',
  summary: '',
  draft: true,
  content: '',
})
const tagsText = ref('')
const saving = ref(false)
const preview = computed(() => render(form.value.content))
const hasContent = computed(() => Boolean(form.value.content.trim()))

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
      <el-button text @click="goBack">返回</el-button>
      <div class="editor-title">
        <h1>添加文章</h1>
        <p>左侧编辑内容，右侧实时查看 Markdown 渲染效果。</p>
      </div>
      <el-button type="primary" :loading="saving" @click="save">保存文章</el-button>
    </header>

    <div class="editor-layout">
      <section class="editor-panel editor-form-panel">
        <el-form label-position="top" class="editor-form">
          <div class="panel-heading">
            <span class="panel-index">01</span>
            <div>
              <h2>基本信息</h2>
              <p>标题、分类、标签和摘要会用于文章列表展示。</p>
            </div>
          </div>

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
              :rows="3"
              placeholder="列表页显示的简短摘要，可留空"
            />
          </el-form-item>

          <div class="panel-heading content-heading">
            <span class="panel-index">02</span>
            <div>
              <h2>正文 Markdown</h2>
              <p>支持 Markdown、代码块和原始 HTML。</p>
            </div>
          </div>

          <el-form-item required>
            <el-input
              v-model="form.content"
              type="textarea"
              :autosize="{ minRows: 20, maxRows: 40 }"
              placeholder="在这里编写 Markdown 正文"
            />
          </el-form-item>
        </el-form>
      </section>

      <aside class="preview-panel" aria-label="Markdown 实时预览">
        <div class="panel-heading preview-heading">
          <span class="panel-index">03</span>
          <div>
            <h2>实时预览</h2>
            <p>预览效果与文章详情页保持一致。</p>
          </div>
        </div>
        <div v-if="hasContent" class="markdown-body preview-content" v-html="preview"></div>
        <div v-else class="preview-empty">在左侧输入正文后，这里会显示预览。</div>
      </aside>
    </div>
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
  font-size: 26px;
}

.editor-title p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(460px, 1.05fr) minmax(380px, 0.95fr);
  align-items: start;
  gap: 22px;
}

.editor-panel,
.preview-panel {
  border: 1px solid var(--blog-border);
  border-radius: 14px;
  background-color: var(--blog-surface);
  box-shadow: var(--blog-shadow);
}

.editor-panel {
  padding: 24px;
}

.preview-panel {
  position: sticky;
  top: 78px;
  min-height: 560px;
  max-height: calc(100vh - 98px);
  padding: 24px;
  overflow: auto;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
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

.content-heading {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--blog-border);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.preview-heading {
  position: sticky;
  top: 0;
  z-index: 1;
  padding-bottom: 14px;
  background-color: var(--blog-surface);
}

.preview-content {
  padding-top: 4px;
}

.preview-empty {
  display: grid;
  min-height: 360px;
  place-items: center;
  border: 1px dashed var(--blog-border);
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

@media (max-width: 1050px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    position: static;
    min-height: 420px;
    max-height: none;
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

  .editor-panel,
  .preview-panel {
    padding: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}
</style>
