<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { useAuth } from '../utils/auth.js'

const route = useRoute()
const router = useRouter()
const { currentUser, isStaff, loadCurrentUser, updateAccount } = useAuth()

const form = ref({
  username: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
})
const saving = ref(false)

function validate() {
  if (!form.value.username.trim()) {
    ElMessage.warning('请输入用户名')
    return false
  }
  if (!form.value.current_password) {
    ElMessage.warning('请输入当前密码')
    return false
  }
  if (form.value.new_password !== form.value.confirm_password) {
    ElMessage.warning('两次输入的新密码不一致')
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
    const user = await updateAccount({
      username: form.value.username.trim(),
      current_password: form.value.current_password,
      new_password: form.value.new_password,
      confirm_password: form.value.confirm_password,
    })
    form.value.username = user.username
    form.value.current_password = ''
    form.value.new_password = ''
    form.value.confirm_password = ''
    ElMessage.success('账号信息已更新')
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCurrentUser()
  if (!isStaff.value) {
    router.replace({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  form.value.username = currentUser.value.username
})
</script>

<template>
  <div class="blog-container page account-page">
    <div class="account-header">
      <h1>账号设置</h1>
      <p>修改当前管理员账号的用户名或密码。</p>
    </div>

    <el-form label-position="top" class="account-form">
      <el-form-item label="用户名" required>
        <el-input v-model="form.username" autocomplete="username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="当前密码" required>
        <el-input
          v-model="form.current_password"
          type="password"
          show-password
          autocomplete="current-password"
          placeholder="请输入当前密码"
        />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="form.new_password"
          type="password"
          show-password
          autocomplete="new-password"
          placeholder="不修改密码可留空"
        />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input
          v-model="form.confirm_password"
          type="password"
          show-password
          autocomplete="new-password"
          placeholder="再次输入新密码"
        />
      </el-form-item>
      <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
    </el-form>
  </div>
</template>

<style scoped>
.account-page {
  max-width: 680px;
}

.account-header {
  margin-bottom: 22px;
}

.account-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.account-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.account-form {
  padding: 24px;
  border: 1px solid var(--blog-border);
  border-radius: 12px;
  background-color: var(--blog-surface);
}
</style>
