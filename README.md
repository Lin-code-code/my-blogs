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

在 `src/posts/` 目录下新建 `.md` 文件即可，文件名就是文章地址里的 slug，
例如 `src/posts/my-first-post.md` 对应 `#/post/my-first-post`。构建时会自动扫描该目录，
无需手动注册。

本地也可以在网页里写文章：运行 `npm run dev` 后点顶栏的「写文章」，填写标题、分类、标签、日期、摘要和草稿状态，正文用带工具栏的 Markdown 编辑器。保存的文件名由服务端按秒级时间戳生成（如 `20261008153012.md`），写入 `src/posts/`，同一秒内重复创建会自动追加序号。

**线上（Netlify）同样可以写**：`netlify/functions/posts.mjs` 校验口令后，用 GitHub API 把 Markdown 提交进 `src/posts/`，然后由自动构建带上线。线上第一次保存前要在编辑器里填一次「编辑口令」，之后本机记住；保存到上线约 1-2 分钟。

线上写文章依赖两个 Netlify 环境变量：

| 变量 | 作用 |
| --- | --- |
| `GITHUB_TOKEN` | fine-grained PAT，只授权本仓库，权限 `Contents: Read and write` |
| `EDITOR_PASSWORD` | 编辑器口令，写接口用它鉴权 |

GitHub Pages 没有 Serverless Function，所以那边不显示「写文章」入口（入口由 `VITE_HAS_EDITOR` 控制，Netlify 在 `netlify.toml` 里置为 `true`）。

frontmatter 字段：

```yaml
---
title: 文章标题
date: 2026-09-10
tags: [Vue, 前端]
category: 技术
summary: 列表页显示的摘要，不填则自动截取正文
draft: false
---
```

`draft: true` 的文章不会出现在文章列表、首页和上下篇导航里，但可以用详情页直链预览。

## 目录结构

```
src/
  posts/                Markdown 文章
  components/          通用组件（文章卡片）
  layout/AppLayout.vue 顶栏、页脚、深色模式切换
  pages/               首页、文章列表、文章详情、文章编辑、关于
  router/index.js      路由配置
  styles/main.css      全局样式与 Markdown 排版
  utils/blog.js        扫描文章、解析 frontmatter、筛选与渲染
  utils/editorApi.js   文章写入接口的调用封装
  utils/useDarkMode.js 深色模式组合式函数
netlify/functions/posts.mjs
                            线上写文章后端（Netlify Function）
shared/postMarkdown.js      frontmatter 生成，本地与线上共用
vite/blogPlugin.js          开发服务器上的文章写入 API（仅本地生效）
```

## 部署到 GitHub Pages

`.github/workflows/deploy.yml` 已配置好：推送到 `main` 分支后会自动构建并发布。

部署前确认两点：

1. 仓库名与 `vite.config.js` 里的 `base` 一致，默认是 `/my-blogs/`。
2. 仓库 Settings → Pages → Source 选择 `GitHub Actions`。

换用其他静态托管平台时，把 `base` 改成 `/` 即可。

## 已知取舍

- 不带评论系统，文章直接写 Markdown 文件，网页编辑在本地和 Netlify 线上都可用。
- 线上保存是先提交 Markdown 再等自动构建，约 1-2 分钟后才在站点看到。
- 文章文件名即地址，创建后不会随标题变化。
- 路由使用 hash 模式，静态托管无需服务端重写规则。
