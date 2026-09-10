<script setup>
import { Cpu, Football, Message, Reading, School } from '@element-plus/icons-vue'

// 个人信息集中在这里修改即可
const profile = {
  name: '你的名字',
  tagline: '一句话介绍自己，比如：热爱前端开发，也热爱一切有趣的事物。',
  school: 'XX 大学',
  major: '你的专业',
  email: 'you@example.com',
  techStack: ['Vue 3', 'JavaScript', 'Node.js', 'Element Plus', 'Git'],
  hobbies: ['编程', '阅读', '摄影', '旅行'],
}

// 单值信息行，避免模板里重复结构
const infoRows = [
  { label: '学校', icon: School, value: profile.school },
  { label: '专业', icon: Reading, value: profile.major },
  { label: '邮箱', icon: Message, value: profile.email },
]
</script>

<template>
  <div class="blog-container page about">
    <header class="page-head">
      <h1>欢迎来到我的个人博客</h1>
    </header>

    <section class="profile-card">
      <div class="profile-head">
        <div class="avatar" aria-hidden="true">{{ profile.name.slice(0, 1) }}</div>
        <div class="profile-intro">
          <h2>{{ profile.name }}</h2>
          <p>{{ profile.tagline }}</p>
        </div>
      </div>

      <dl class="profile-rows">
        <div v-for="row in infoRows" :key="row.label" class="profile-row">
          <dt>
            <el-icon><component :is="row.icon" /></el-icon>
            {{ row.label }}
          </dt>
          <dd>{{ row.value }}</dd>
        </div>

        <div class="profile-row">
          <dt>
            <el-icon><Cpu /></el-icon>
            技术栈
          </dt>
          <dd class="chips">
            <span v-for="item in profile.techStack" :key="item" class="chip">{{ item }}</span>
          </dd>
        </div>

        <div class="profile-row">
          <dt>
            <el-icon><Football /></el-icon>
            兴趣爱好
          </dt>
          <dd class="chips">
            <span v-for="item in profile.hobbies" :key="item" class="chip">{{ item }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <p class="about-text">
      这是我的个人博客，基于 Vue 3 + Vite + Element Plus 搭建，文章为 Markdown 文件，构建为纯静态站点。
    </p>
  </div>
</template>

<style scoped>
.about-text {
  max-width: 66ch;
  line-height: 1.85;
  color: var(--el-text-color-regular);
}

.profile-card {
  position: relative;
  max-width: 640px;
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid var(--blog-border);
  border-radius: 8px;
  background-color: var(--blog-surface);
  box-shadow: var(--blog-shadow);
  overflow: hidden;
}

/* 卡片顶部常驻渐变细线，和站点主题呼应 */
.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-image: var(--grad-brand);
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--blog-border);
}

.avatar {
  flex: none;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background-image: var(--grad-brand);
  color: var(--blog-on-brand);
  font-size: 24px;
  font-weight: 700;
}

.profile-intro h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.profile-intro p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.profile-rows {
  margin: 0;
  padding-top: 6px;
}

.profile-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--blog-border);
}

.profile-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.profile-row dt {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  width: 92px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.profile-row dt :deep(.el-icon) {
  color: var(--blog-accent-text);
}

.profile-row dd {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 3px 10px;
  border-radius: 6px;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .profile-card {
    padding: 18px;
  }

  .profile-row {
    flex-direction: column;
    gap: 6px;
  }

  .profile-row dt {
    width: auto;
  }
}
</style>
