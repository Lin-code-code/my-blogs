<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserFilled } from '@element-plus/icons-vue'
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
  <div class="account-page">
    <section class="account-hero">
      <div class="account-avatar" aria-hidden="true">
        <el-icon :size="24"><UserFilled /></el-icon>
      </div>
      <div>
        <p class="eyebrow">账户中心</p>
        <h1>账号设置</h1>
        <p class="account-desc">修改管理员用户名或密码，修改后当前登录状态会保持。</p>
      </div>
    </section>

    <el-form label-position="top" class="account-form">
      <section class="form-section">
        <div class="section-heading">
          <h2>账号信息</h2>
          <p>用户名用于登录，不能与其他账号重复。</p>
        </div>
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" autocomplete="username" placeholder="请输入用户名" />
        </el-form-item>
      </section>

      <div class="section-divider"></div>

      <section class="form-section">
        <div class="section-heading">
          <h2>修改密码</h2>
          <p>修改用户名也必须填写当前密码；不需要修改密码时，新密码留空即可。</p>
        </div>
        <el-form-item label="当前密码" required>
          <el-input
            v-model="form.current_password"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入当前密码"
          />
        </el-form-item>
        <div class="password-grid">
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
        </div>
      </section>

      <div class="form-actions">
        <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.account-page {
  max-width: 760px;
  margin: 0 auto;
  padding-top: 28px;
  padding-bottom: 56px;
  padding-left: 20px;
  padding-right: 20px;
}

.account-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
  padding: 22px;
  border: 1px solid var(--blog-border);
  border-radius: 14px;
  background-color: var(--blog-surface);
  box-shadow: var(--blog-shadow);
}

.account-avatar {
  display: grid;
  flex: none;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 16px;
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--blog-accent-text);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.account-hero h1 {
  margin: 0 0 6px;
  font-size: 25px;
}

.account-desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.account-form {
  padding: 24px;
  border: 1px solid var(--blog-border);
  border-radius: 14px;
  background-color: var(--blog-surface);
}

.section-heading {
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0 0 5px;
  font-size: 18px;
}

.section-heading p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.section-divider {
  height: 1px;
  margin: 24px 0;
  background-color: var(--blog-border);
}

.password-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

@media (max-width: 680px) {
  .account-page {
    padding-top: 18px;
  }

  .account-hero {
    align-items: flex-start;
    padding: 18px;
  }

  .account-form {
    padding: 18px;
  }

  .password-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
