<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { useAuth } from '../utils/auth.js'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, loadCurrentUser, login } = useAuth()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const redirect = computed(() => String(route.query.redirect || '/'))

onMounted(async () => {
  await loadCurrentUser()
  if (isAuthenticated.value) {
    router.replace(redirect.value)
  }
})

async function submit() {
  if (!username.value.trim() || !password.value) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  submitting.value = true
  try {
    await login(username.value.trim(), password.value)
    ElMessage.success('登录成功')
    router.replace(redirect.value)
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="blog-container page login-page">
    <div class="login-card">
      <h1>管理员登录</h1>
      <p>登录后可以进入写文章页面。</p>

      <el-form label-position="top">
          <el-form-item label="用户名">
            <el-input v-model="username" autocomplete="username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="password"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </el-form-item>
          <el-button type="primary" :loading="submitting" class="submit" @click="submit">
            登录
          </el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  flex: 1;
  display: grid;
  place-items: center;
}

.login-card {
  width: min(400px, 100%);
  min-height: 320px;
  padding: 28px;
  border: 1px solid var(--blog-border);
  border-radius: 12px;
  background-color: var(--blog-surface);
  box-shadow: 0 14px 36px rgba(90, 30, 20, 0.08);
}

.login-card h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.login-card p {
  margin: 0 0 22px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.submit {
  width: 100%;
}
</style>
