# 部署说明

后端用 Docker Compose 跑在服务器上（Gunicorn + PostgreSQL 容器），前端继续用 Netlify。

## 架构

```text
浏览器 → https://lin-blog.netlify.app/          Netlify 静态站点
              └─ /api/* 由 Netlify 代理 ──────→ http://<服务器IP>:8000  后端容器
                                                        └─ db 容器（PostgreSQL）
```

前端所有请求都发给 Netlify 自己的域名，由 Netlify 在服务端转发到后端，所以浏览器视角始终同源，`SameSite=Lax` 的 Session/CSRF Cookie 能正常工作。

## 需要你先准备

- 一台有公网 IP 的 Linux 服务器，能 SSH 登录
- 服务器已装好 Docker 和 Docker Compose 插件
- 仓库代码已推送到 GitHub（本项目的 `origin`）
- Netlify 站点 `lin-blog.netlify.app` 的管理权限

## 一、服务器上拉代码

```bash
sudo mkdir -p /srv/my-blogs
sudo chown "$USER":"$USER" /srv/my-blogs
git clone git@github.com:Lin-code-code/my-blogs.git /srv/my-blogs
cd /srv/my-blogs
```

如果服务器没有配 Git 的 SSH key，改用 HTTPS 加 Personal Access Token，或者在你本机执行 `scp -r` 上传。

## 二、生成生产配置文件

```bash
cd /srv/my-blogs
cp .env.production.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # 生成密钥
nano .env
```

`.env` 里必须替换的项：

| 变量 | 填什么 |
| --- | --- |
| `DJANGO_SECRET_KEY` | 上一步生成的随机串 |
| `DJANGO_ALLOWED_HOSTS` | 服务器公网 IP |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | 保持 `https://lin-blog.netlify.app` |
| `DB_PASSWORD` | 自己定的强密码 |
| `DJANGO_COOKIE_SECURE` | 保持 `0` |

`DJANGO_COOKIE_SECURE=0` 不能改成 `1`：后端只有 HTTP，没有域名也拿不到证书。设成 `1` 浏览器会拒绝保存登录 Cookie，Django Admin 会登录不上。

## 三、放行端口

后端容器监听 `8000`，需要在服务器防火墙和安全组放行 TCP 8000，否则 Netlify 代理和 Netlify 构建都连不上。

```bash
sudo ufw allow 8000/tcp
```

云服务器还要在控制台的安全组里放行 8000。数据库端口不要对外放行，`db` 容器只在 compose 内部网络暴露。

## 四、启动

```bash
cd /srv/my-blogs
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

首次启动会自动执行数据库迁移和静态文件收集，然后启动 Gunicorn。日志里出现 `Listening at: http://0.0.0.0:8000` 就算起来了。

验证后端：

```bash
curl http://127.0.0.1:8000/api/v1/posts/
curl http://<服务器IP>:8000/api/v1/posts/
```

## 五、建管理员账号

```bash
docker compose exec web python manage.py createsuperuser
```

这个账号要勾选 `is_staff`，否则前端写文章的接口会返回 403。

访问 `http://<服务器IP>:8000/admin/` 可以确认登录正常。

## 六、配置 Netlify

1. 把 `netlify.toml` 里的 `YOUR_SERVER_IP` 换成服务器公网 IP，提交并推送。这一步不做，`/api/*` 会指向错误地址。
2. 进入 Netlify 站点 → Site configuration → Environment variables，添加：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `BLOG_API_BASE_URL` | `http://<服务器IP>:8000` | 构建时同步文章用 |
| `VITE_API_BASE_URL` | 留空 | 空值让前端走同源 `/api/`，交给 Netlify 代理 |
| `VITE_BASE_PATH` | `/` | 已在 netlify.toml 里设置 |

`VITE_API_BASE_URL` 一定要留空。填成后端地址会变成跨域直连，Cookie 属于第三方 Cookie，Safari 和 Chrome 会拦截，登录会随机失效。

3. 触发一次 Deploy。构建时 `npm run build` 会先执行 `sync-content` 拉取文章，所以此时后端必须能访问，否则构建直接失败。

## 七、上线后验证

1. 打开 `https://lin-blog.netlify.app/`，首页应显示文章。
2. 打开 `https://lin-blog.netlify.app/#/login`，用第五步的账号登录。
3. 登录后进入 `#/editor` 发一篇草稿，确认保存成功并能在 `#/drafts` 看到。
4. 浏览器开发者工具里检查 `/api/v1/auth/me/` 返回 200，且 Cookie 里有 `sessionid` 和 `csrftoken`。

## 日常更新

后端代码有改动：

```bash
cd /srv/my-blogs
git pull
docker compose up -d --build
```

前端改动只要推到 GitHub，Netlify 会自动构建。

## 数据备份

数据库数据在 Docker 卷 `pgdata` 里，容器删了数据还在，但 `docker compose down -v` 会连卷一起删，别用 `-v`。

```bash
docker compose exec db pg_dump -U my_blogs my_blogs > backup-$(date +%F).sql
```

## 常见问题

**登录后立刻掉登录态**：检查 `DJANGO_COOKIE_SECURE` 是否为 `0`，以及 `VITE_API_BASE_URL` 是否留空。

**Netlify 构建失败在 sync-content**：后端没起或 8000 端口没放行，Netlify 构建机拉不到文章接口。

**前端 /api/ 返回 502**：`netlify.toml` 里的 IP 没换，或者服务器安全组没放行 8000。

**Admin 静态样式丢失**：看容器启动日志里 `collectstatic` 是否报错；`STATIC_ROOT` 已配好，正常情况下 WhiteNoise 会自动托管。

## 安全提醒

后端目前是明文 HTTP，Netlify 代理到服务器的这一段没有加密，管理员密码和会话 Cookie 会以明文经过公网。能用，但不理想。等你有域名后，在服务器前面加一层 Caddy 自动申请 Let's Encrypt 证书，把 `netlify.toml` 的目标改成 `https://`，并把 `DJANGO_COOKIE_SECURE` 改回 `1`，这段风险就消掉了。
