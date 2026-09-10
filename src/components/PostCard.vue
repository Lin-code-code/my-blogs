<script setup>
defineProps({
  post: { type: Object, required: true },
})
</script>

<template>
  <el-card class="post-card" shadow="never">
    <router-link :to="`/post/${post.slug}`" class="title">{{ post.title }}</router-link>
    <p class="summary">{{ post.summary }}</p>
    <div class="meta post-tags">
      <span class="date">{{ post.date }}</span>
      <el-tag v-if="post.category" size="small" type="info">{{ post.category }}</el-tag>
      <el-tag v-for="t in post.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
    </div>
  </el-card>
</template>

<style scoped>
.post-card {
  position: relative;
  margin-bottom: 16px;
  border: 1px solid var(--blog-border);
  border-radius: 8px;
  background-color: var(--blog-surface);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

/* 悬停时左侧浮出一条渐变竖线 */
.post-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-image: var(--grad-brand);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  border-color: transparent;
  box-shadow: var(--blog-shadow);
  background-image: linear-gradient(var(--blog-surface), var(--blog-surface)), var(--grad-brand);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.post-card:hover::before {
  opacity: 1;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-decoration: none;
}

.title:hover {
  background-image: var(--grad-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.summary {
  margin: 8px 0 12px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
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
</style>
