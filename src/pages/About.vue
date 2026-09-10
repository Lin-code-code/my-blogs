<script setup>
</script>

<template>
  <div class="blog-container page about">
    <header class="page-head">
      <h1>关于我</h1>
    </header>
    <p>这里写自我介绍。可以在 <code>src/pages/About.vue</code> 中修改。</p>
    <p>这个博客使用 Vue 3 + Vite + Element Plus 搭建，文章为 Markdown 文件，构建为纯静态站点。</p>
  </div>
</template>

<style scoped>
.about p {
  max-width: 66ch;
  line-height: 1.85;
  color: var(--el-text-color-regular);
}

.about code {
  padding: 2px 6px;
  border-radius: 6px;
  background-image: var(--grad-brand-soft);
  color: var(--blog-accent-text);
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
}
</style>
