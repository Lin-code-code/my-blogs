# 我的博客

基于 Vue 3 + Vite 的静态博客，文章由独立的 Django + PostgreSQL 后端管理，构建时同步到前端。

## 技术栈

- Vue 3（JavaScript + 组合式 API `<script setup>`）
- Vite 5
- Element Plus
- Vue Router（hash 模式）
- markdown-it + highlight.js
- Django 5.2
- PostgreSQL 18

## 本地配置

项目根目录使用统一配置文件：

```text
.env       本地真实配置，不提交仓库
.env.example 配置模板
```

首次运行：

```powershell
Copy-Item .env.example .env
```

然后在 `.env` 中填写数据库密码等本地配置。

## 本地开发

先启动 Django API：

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8000
```

再启动前端：

```powershell
cd E:\AlProject\my_blogs
npm run dev
```

`npm run dev` 和 `npm run build` 会通过 `.env` 中的 `BLOG_API_BASE_URL` 调用 Django API，并生成 `src/generated/posts.json`。

## 文章管理

文章通过 Django Admin 管理：

```text
http://127.0.0.1:8000/admin/
```

公开只读接口：

```text
GET http://127.0.0.1:8000/api/v1/posts/
```

接口只返回 `draft=false` 的文章。

## 目录结构

```text
src/
  components/          通用组件
  layout/              页面布局
  pages/               首页、文章列表、文章详情、关于
  router/index.js      前端路由
  utils/blog.js        读取构建时同步的文章数据
  posts/               旧 Markdown 文章，迁移验证完成前保留

scripts/
  sync-content.mjs     构建时同步 Django 文章

backend/
  config/              Django 配置，自动读取根目录 .env
  blog/                文章模型、Admin、API 和导入命令
  requirements.txt     Python 依赖
```

## 构建

```powershell
npm run build
```

部署阶段尚未配置，本地测试通过后再单独处理 Linux 服务器、HTTPS 和 Netlify Build Hook。
