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
    <div class="editor-header">
      <el-button text @click="goBack">返回</el-button>
      <h1>添加文章</h1>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
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
          <span class="field-hint">草稿不会出现在游客文章列表中</span>
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
      <el-form-item label="正文 Markdown" required>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="18"
          placeholder="在这里编写 Markdown 正文"
        />
      </el-form-item>
    </el-form>

    <section class="preview-section">
      <h2>实时预览</h2>
      <div class="markdown-body" v-html="preview"></div>
    </section>
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

.editor-form {
  margin-bottom: 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-grid :deep(.el-form-item:first-child) {
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

.preview-section {
  padding-top: 22px;
  border-top: 1px solid var(--blog-border);
}

.preview-section h2 {
  margin: 0 0 16px;
  font-size: 18px;
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
}
</style>
