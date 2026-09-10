# 我的博客

基于 Vue 3 + Vite + Element Plus 的个人静态博客，文章使用 Markdown 编写，构建后是纯静态站点。

## 技术栈

- Vue 3（JavaScript + 组合式 API `<script setup>`）
- Vite 5
- Element Plus（按需注册组件）
- Vue Router（hash 模式）
- markdown-it + highlight.js 渲染正文与代码高亮
- js-yaml 解析文章 frontmatter

## 本地开发

```bash
npm install
npm run dev
```

构建与预览生产产物：

```bash
npm run build
npm run preview
```

## 写文章

在 `posts/` 目录下新建 `.md` 文件即可，文件名就是文章地址里的 slug，
例如 `posts/my-first-post.md` 对应 `#/post/my-first-post`。构建时会自动扫描该目录，
无需手动注册。

frontmatter 字段：

```yaml
---
title: 文章标题
date: 2026-09-10
tags: [Vue, 前端]
category: 技术
summary: 列表页显示的摘要，不填则自动截取正文
---
```

## 目录结构

```
posts/                 Markdown 文章
src/
  components/          通用组件（文章卡片）
  layout/AppLayout.vue 顶栏、页脚、深色模式切换
  pages/               首页、文章列表、文章详情、关于
  router/index.js      路由配置
  styles/main.css      全局样式与 Markdown 排版
  utils/blog.js        扫描文章、解析 frontmatter、筛选与渲染
  utils/useDarkMode.js 深色模式组合式函数
```

## 部署到 GitHub Pages

`.github/workflows/deploy.yml` 已配置好：推送到 `main` 分支后会自动构建并发布。

部署前确认两点：

1. 仓库名与 `vite.config.js` 里的 `base` 一致，默认是 `/my_blogs/`。
2. 仓库 Settings → Pages → Source 选择 `GitHub Actions`。

换用其他静态托管平台时，把 `base` 改成 `/` 即可。

## 已知取舍

- 不带评论系统和后台管理，文章直接写 Markdown 文件。
- 路由使用 hash 模式，静态托管无需服务端重写规则。
