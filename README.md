# 我的博客

基于 Vue 3 + Vite 的静态博客，文章由独立的 Django + PostgreSQL 后端管理。游客可以查看文章，管理员登录后可以在前端新增文章。

## 技术栈

- Vue 3（JavaScript + 组合式 API `<script setup>`）
- Vite 5
- Element Plus
- Vue Router（hash 模式）
- markdown-it + highlight.js
- Django 5.2
- PostgreSQL 18

## 本地配置

根目录使用统一配置文件：

```text
.env         本地真实配置，不提交仓库
.env.example 配置模板
```

首次运行：

```powershell
Copy-Item .env.example .env
```

然后在 `.env` 中填写数据库密码等本地配置。

## 本地运行

启动 Django API：

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8000
```

启动前端：

```powershell
cd E:\AlProject\my_blogs
npm run dev
```

访问：

```text
前端：http://127.0.0.1:5173/
登录：http://127.0.0.1:5173/#/login
写文章：http://127.0.0.1:5173/#/editor
Django Admin：http://127.0.0.1:8000/admin/
```

## 权限规则

- 游客只能查看文章。
- 只有登录的 Django `is_staff` 用户才能写文章。
- 登录使用 Django Session 和 CSRF，不使用独立编辑口令。
- 写文章接口：`POST /api/v1/admin/posts/`。
- 公开文章接口：`GET /api/v1/posts/`。

## 文章同步

`npm run dev` 和 `npm run build` 会通过 `.env` 中的 `BLOG_API_BASE_URL` 调用 Django API，并生成 `src/generated/posts.json` 作为构建时兜底数据。

管理员在前端保存文章后，前端会立即重新请求公开文章接口并刷新页面数据。

## 目录结构

```text
src/
  components/          通用组件
  layout/              页面布局
  pages/               首页、文章列表、文章详情、登录、添加文章、关于
  router/index.js      前端路由
  utils/api.js         前端 API 请求封装
  utils/auth.js        Django 登录状态
  utils/blog.js        文章数据与 Markdown 渲染
  utils/editorApi.js   管理员写文章接口
  posts/               旧 Markdown 文章，迁移验证完成前保留

scripts/
  sync-content.mjs     构建时同步 Django 文章

backend/
  config/              Django 配置，自动读取根目录 .env
  blog/                文章模型、Admin、认证和文章接口
  requirements.txt     Python 依赖
```
