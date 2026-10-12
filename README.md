# 我的博客

基于 Vue 3 + Vite 的静态博客，文章由独立的 Django + PostgreSQL 后端管理。游客可以查看文章，管理员登录后可以在前端新增文章、保存草稿和修改账号。

## 技术栈

- Vue 3（JavaScript + 组合式 API `<script setup>`）
- Vite 5
- Element Plus
- Vue Router（hash 模式）
- markdown-it + highlight.js
- md-editor-v3 双栏 Markdown 编辑器
- Django 5.2 + gunicorn + WhiteNoise
- PostgreSQL（本地 18，Docker 部署使用 16-alpine）

## 功能概览

- 首页、文章列表（搜索/标签/分类筛选）、文章详情（上下篇导航、代码块一键复制）
- 深色模式：localStorage 持久化，默认跟随系统偏好
- 管理员在线写文章：md-editor-v3 双栏编辑器，工具栏、实时预览、字数统计、同步滚动
- 草稿箱：保存为草稿的文章不对游客展示，管理员可在草稿箱查看
- 账号设置：修改管理员用户名和密码（改密校验当前密码，改后保持登录状态）
- Django Admin 后台维护文章

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

然后在 `.env` 中填写数据库密码等本地配置。关键变量：

```text
DJANGO_SECRET_KEY / DJANGO_DEBUG / DJANGO_ALLOWED_HOSTS   Django 运行配置
DJANGO_CSRF_TRUSTED_ORIGINS / DJANGO_COOKIE_SAMESITE      跨源与 Cookie 配置
DJANGO_COOKIE_SECURE                                      后端走 HTTPS 时设为 1
DB_NAME / DB_USER / DB_PASSWORD / DB_HOST / DB_PORT       PostgreSQL 连接
BLOG_API_BASE_URL                                         构建时同步文章的 Django API 地址
VITE_API_BASE_URL / VITE_BASE_PATH                        前端请求地址与部署路径
```

## 本地运行

准备 PostgreSQL 数据库（创建 `.env` 中配置的 `DB_NAME`/`DB_USER`），首次运行需安装依赖并迁移：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

启动 Django API：

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8000
```

启动前端（`predev` 会自动执行文章同步）：

```powershell
npm run dev
```

访问：

```text
前端：http://127.0.0.1:5173/
登录：http://127.0.0.1:5173/#/login
写文章：http://127.0.0.1:5173/#/editor
草稿箱：http://127.0.0.1:5173/#/drafts
账号设置：http://127.0.0.1:5173/#/account
Django Admin：http://127.0.0.1:8000/admin/
```

## 权限规则

- 游客只能查看已发布文章。
- 只有登录的 Django `is_staff` 用户才能写文章、查看草稿箱和修改账号。
- 登录使用 Django Session 和 CSRF，不使用独立编辑口令。
- 文章接口：
  - `GET /api/v1/posts/` 公开已发布文章（`draft=false`）
  - `POST /api/v1/admin/posts/` 新增文章，支持 `draft` 字段
  - `GET /api/v1/admin/drafts/` 草稿列表（仅管理员）
- 认证接口：`/api/v1/auth/login/`、`/logout/`、`/me/`、`/account/`。

## 文章同步

`npm run dev` 和 `npm run build` 会先执行 `scripts/sync-content.mjs`，通过 `.env` 中的 `BLOG_API_BASE_URL` 调用 Django API，生成 `src/generated/posts.json` 作为构建时兜底数据。

管理员在前端保存文章后，前端会立即重新请求公开文章接口并刷新页面数据。草稿不进入列表、首页和上下篇导航。账号设置页可以修改用户名和密码。

## 部署

- 后端：根目录 `docker-compose.yml` 一键启动（web + db），`backend/Dockerfile` 内置 migrate + collectstatic + gunicorn，WhiteNoise 托管静态文件，`/api/*` 由 Netlify 代理保持同源。详见 `DEPLOY.md`。
- 前端：静态站点托管（GitHub Pages / Netlify），构建时通过同步脚本拉取最新文章。

生产环境变量模板见 `.env.production.example`。

## 目录结构

```text
src/
  assets/              静态资源（背景图等）
  components/          通用组件
  layout/              页面布局
  pages/               首页、文章列表、文章详情、登录、写文章、草稿箱、账号设置、关于
  router/index.js      前端路由
  styles/main.css      全局样式与设计令牌
  utils/api.js         前端 API 请求封装
  utils/auth.js        Django 登录状态
  utils/blog.js        文章数据与 Markdown 渲染
  utils/editorApi.js   管理员写文章与草稿接口
  generated/           构建时同步生成的 posts.json（由脚本产出）
  posts/               旧 Markdown 文章，迁移验证完成前保留

scripts/
  sync-content.mjs     构建时同步 Django 文章
  sync-content.test.mjs 同步脚本测试

backend/
  config/              Django 配置，自动读取根目录 .env
  blog/                文章模型、Admin、认证、草稿和文章接口
  Dockerfile           后端生产镜像
  entrypoint.sh        启动时 migrate + collectstatic + gunicorn
  requirements.txt     Python 依赖

docker-compose.yml     生产部署编排（web + postgres）
```

## 常用命令

```powershell
npm run dev           # 启动前端（自动同步文章）
npm run build         # 构建生产包（自动同步文章）
npm run preview       # 本地预览构建结果
npm run sync-content  # 手动同步 Django 文章
npm run test:sync     # 运行同步脚本测试
cd backend; python manage.py test   # 运行后端测试
```
