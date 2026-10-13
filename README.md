# 我的博客

Vue 3 + Vite 前端，配一个独立的 Django + PostgreSQL 后端。游客可以阅览文章；管理员登录后可以在站内写文章、管草稿、编辑和删除已发布文章、修改账号。

## 技术栈

- Vue 3（JavaScript + 组合式 API `<script setup>`）+ Vite 5
- Element Plus、Vue Router（hash 模式）
- markdown-it + highlight.js（正文渲染与代码高亮）
- md-editor-v3（双栏 Markdown 编辑器）
- Django 5.2 + gunicorn + WhiteNoise
- PostgreSQL 18（本地与 Docker 部署一致）
- 前端托管在 Netlify，后端用 Docker Compose 跑在自有服务器

## 功能概览

- 首页、文章列表（关键词 / 标签 / 分类筛选）、文章详情（上下篇导航、代码块一键复制、创建与修改时间）
- 深色模式：localStorage 持久化，默认跟随系统偏好
- 在线写文章：md-editor-v3 双栏编辑器，工具栏、实时预览、字数统计、同步滚动，可直接存为草稿
- 草稿箱：草稿不对游客展示，管理员可查看并「继续编辑」跳回站内编辑器
- 文章管理（`/#/manage`）：编辑、删除已发布文章
- 账号设置：修改管理员用户名和密码（改密校验当前密码，改后保持登录状态）
- Django Admin 后台维护文章

## 本地配置

根目录使用统一配置文件：

```text
.env                    本地真实配置，不提交仓库
.env.example            本地开发模板
.env.production.example 服务器生产模板
```

首次运行：

```powershell
Copy-Item .env.example .env
```

然后在 `.env` 里填写数据库密码等本地配置。关键变量：

```text
DJANGO_SECRET_KEY / DJANGO_DEBUG / DJANGO_ALLOWED_HOSTS   Django 运行配置
DJANGO_CSRF_TRUSTED_ORIGINS / DJANGO_COOKIE_SAMESITE      跨源与 Cookie 配置
DJANGO_COOKIE_SECURE                                      后端走 HTTPS 时设为 1，HTTP 保持 0
DB_NAME / DB_USER / DB_PASSWORD / DB_HOST / DB_PORT       PostgreSQL 连接
BLOG_API_BASE_URL                                         构建时同步文章的 Django API 地址
VITE_API_BASE_URL / VITE_BASE_PATH                        前端请求地址与部署路径，留空表示走同源
```

`DJANGO_CSRF_TRUSTED_ORIGINS` 里的前端端口要和 Vite 实际使用的端口对上，否则 POST / PUT / DELETE 会被 Django 的 Origin 校验挡成 403。

## 本地运行

先准备 PostgreSQL 数据库（创建 `.env` 中配置的 `DB_NAME` / `DB_USER`），首次运行需安装依赖并迁移：

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

启动前端（`predev` 会自动同步文章）：

```powershell
npm run dev
```

访问地址：

```text
前端：    http://127.0.0.1:5173/
登录：    http://127.0.0.1:5173/#/login
写文章：  http://127.0.0.1:5173/#/editor
草稿箱：  http://127.0.0.1:5173/#/drafts
文章管理：http://127.0.0.1:5173/#/manage
账号设置：http://127.0.0.1:5173/#/account
Django Admin：http://127.0.0.1:8000/admin/
```

## 权限与接口

- 游客只能查看已发布文章。
- 只有登录的 Django `is_staff` 用户才能写文章、管草稿、编辑删除文章和修改账号。
- 登录使用 Django Session + CSRF，不使用独立编辑口令。

| 接口 | 方法 | 权限 |
| --- | --- | --- |
| `/api/v1/posts/` | GET | 公开，只返回 `draft=false` 的文章 |
| `/api/v1/admin/posts/` | POST | 管理员，新增文章，支持 `draft` 字段 |
| `/api/v1/admin/posts/<slug>/` | GET / PUT / DELETE | 管理员，单篇读取、更新、删除 |
| `/api/v1/admin/drafts/` | GET | 管理员，草稿列表 |
| `/api/v1/auth/me/`、`login/`、`logout/`、`account/` | GET / POST | 登录状态与账号维护 |

## 前端数据来源

`npm run dev` 和 `npm run build` 会先执行 `scripts/sync-content.mjs`，通过 `BLOG_API_BASE_URL` 调用 Django API，生成 `src/generated/posts.json` 作为构建时的兜底数据。页面加载后前端还会再请求一次公开接口刷新，所以文章不依赖重新构建。

`src/posts/` 下的 Markdown 是初始内容，新库可以用 `python manage.py import_posts <目录>` 导入。

## 部署

前端托管在 Netlify，后端用 Docker Compose 跑在服务器上，两者通过 Netlify 的 `/api/*` 代理保持同源。

- **后端**：代码由服务器直接 `git pull`（仓库公开，无需凭据），`docker compose up -d --build` 一键重建。`backend/entrypoint.sh` 会自动执行 migrate 和 collectstatic，然后启动 gunicorn，静态文件交给 WhiteNoise。
- **数据库**：PostgreSQL 18 容器，数据挂载到宿主目录 `./data/postgres`（该目录已在 `.gitignore` 中），容器删了重建数据仍在。
- **前端**：Netlify 从 GitHub 的 `main` 分支自动构建；`netlify.toml` 里的 `/api/*` 重定向把请求转发到后端，避免跨站 Cookie 被浏览器拦截。

发布流程：功能在 `develop` 分支开发，合并到 `main` 推送后 Netlify 自动重建前端，服务器再 `git pull && docker compose up -d --build web`。

完整步骤和生产环境变量见 `DEPLOY.md` 与 `.env.production.example`。

## 目录结构

```text
src/
  assets/                静态资源（背景图等）
  components/            通用组件
  layout/                页面布局
  pages/                 首页、文章列表、文章详情、登录、写文章、草稿箱、文章管理、账号设置、关于
  router/index.js        前端路由
  styles/main.css        全局样式与设计令牌
  utils/api.js           请求封装（自动附带 CSRF 头）
  utils/auth.js          Django 登录状态
  utils/blog.js          文章数据、Markdown 渲染、时间格式化
  utils/editorApi.js     管理员文章接口（增删改查、草稿）
  utils/useDarkMode.js   深色模式
  generated/             构建时同步生成的 posts.json
  posts/                 初始 Markdown 文章，可用 import_posts 导入

scripts/
  sync-content.mjs       构建时同步 Django 文章
  sync-content.test.mjs  同步脚本测试

backend/
  config/                Django 配置，自动读取根目录 .env
  blog/                  文章模型、Admin、认证与文章接口
  blog/migrations/       数据库迁移
  blog/tests/            后端测试
  Dockerfile             后端生产镜像（python:3.14.8-slim-trixie + 阿里云 pip 源）
  entrypoint.sh          启动时 migrate + collectstatic + gunicorn
  requirements.txt       Python 依赖

docker-compose.yml       生产编排（web + postgres），数据挂到 ./data/postgres
netlify.toml             Netlify 构建配置与 /api/* 代理
.env.example             本地开发配置模板
.env.production.example  服务器生产配置模板
DEPLOY.md                完整部署步骤
```

## 常用命令

```powershell
npm run dev            # 启动前端（自动同步文章）
npm run build          # 构建生产包（自动同步文章）
npm run preview        # 本地预览构建结果
npm run sync-content   # 手动同步 Django 文章
npm run test:sync      # 运行同步脚本测试

cd backend
.\.venv\Scripts\python.exe manage.py test    # 运行后端测试
```

服务器上更新后端：

```bash
cd /web-project/my-blogs && git pull && docker compose up -d --build web
```
