<script setup>
defineProps({
  post: { type: Object, required: true },
})
</script>

<template>
  <el-card class="post-card paper-panel" shadow="never">
    <div class="card-head">
      <span class="date">{{ post.date }}</span>
      <el-tag v-if="post.category" size="small" class="post-category">{{ post.category }}</el-tag>
    </div>
    <router-link :to="`/post/${post.slug}`" class="title">{{ post.title }}</router-link>
    <p class="summary">{{ post.summary }}</p>
    <div v-if="post.tags.length" class="meta post-tags">
      <el-tag v-for="t in post.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
    </div>
  </el-card>
</template>

<style scoped>
.post-card {
  position: relative;
  min-height: 168px;
  margin-bottom: 0;
  overflow: hidden;
  transition: transform 0.24s var(--ease-out), box-shadow 0.24s ease, border-color 0.24s ease;
}

.post-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-image: var(--grad-brand);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.post-card:hover {
  border-color: rgba(234, 88, 12, 0.22);
  box-shadow: 0 16px 38px rgba(90, 30, 20, 0.11);
  transform: translateY(-3px);
}

.post-card:hover::before {
  opacity: 1;
}

:deep(.el-card__body) {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  padding: 20px 22px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.date {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
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

.post-category {
  border: 0;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  font-weight: 700;
}

.title {
  display: inline-block;
  color: var(--el-text-color-primary);
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 700;
  line-height: 1.35;
  text-decoration: none;
  transition: color 0.2s ease;
}

.title:hover {
  color: var(--blog-accent-text);
}

.summary {
  display: -webkit-box;
  margin: 10px 0 16px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}
</style>
