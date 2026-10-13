# 部署说明

后端用 Docker Compose 跑在服务器上（Gunicorn + PostgreSQL 容器），代码由服务器直接 `git pull` 获取，前端继续用 Netlify。

## 架构

```text
浏览器 → https://lin-blog.netlify.app/          Netlify 静态站点
              └─ /api/* 由 Netlify 代理 ──────→ http://<服务器IP>:8000  blogs-app 容器
                                                          └─ pgsql 容器（PostgreSQL）
                                                                └─ 数据落在 ./data/postgres
```

Compose 里两个服务分别叫 `blogs-app`（Django + gunicorn）和 `pgsql`（PostgreSQL），都接在自定义网络 `blogs-net` 上。

前端所有请求都发给 Netlify 自己的域名，由 Netlify 在服务端转发到后端，所以浏览器视角始终同源，`SameSite=Lax` 的 Session/CSRF Cookie 能正常工作。

## 服务器准备

- 有公网 IP 的 Linux 服务器，能 SSH 登录
- 已安装 Docker 和 Docker Compose 插件
- 已安装 git：`git --version || sudo apt update && sudo apt install -y git`（RHEL 系用 `dnf install -y git`）
- 部署目录 `/web-project/my-blogs`
- 本地已备好两个基础镜像：`postgres:18.6`、`python:3.14.8-slim-trixie`

## 一、拉代码

```bash
cd /web-project/my-blogs
git clone https://github.com/Lin-code-code/my-blogs.git .
```

仓库是公开的，不需要任何凭据。

**这个目录里的文件都由 Git 管理，不要在服务器上直接改。** 直接改 `docker-compose.yml` 之类被跟踪的文件，下次 `git pull` 会因"本地改动会被覆盖"直接报错。要改就在本机改、提交、推送，服务器只负责 pull。

## 二、配置 .env

```bash
cp .env.production.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
nano .env
```

必须填的项：

| 变量 | 填什么 |
| --- | --- |
| `DJANGO_SECRET_KEY` | 上一步生成的随机串 |
| `DJANGO_ALLOWED_HOSTS` | 服务器公网 IP |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://lin-blog.netlify.app` |
| `DB_PASSWORD` | 自己定的强密码 |
| `DJANGO_COOKIE_SECURE` | 保持 `0` |

`.env` 已被 gitignore，`git pull` 不会覆盖它，也不用每次部署重填。

`DJANGO_COOKIE_SECURE=0` 不能改成 `1`：后端只有 HTTP，没有域名也拿不到证书，设成 `1` 浏览器会拒绝保存登录 Cookie，Django Admin 会登录不上。

## 三、数据目录

数据库用宿主目录挂载，数据落在项目下的 `data/postgres`：

```bash
mkdir -p /web-project/my-blogs/data/postgres
```

挂载目标必须保持 `/var/lib/postgresql`。PG 18 的官方镜像把 `PGDATA` 挪到了 `/var/lib/postgresql/18/docker`，如果按老教程挂成 `/var/lib/postgresql/data`，数据会落到容器内的匿名卷里，容器一重建就丢。

`data/` 已在 `.gitignore` 中，不会被提交。

如果容器启动时报 `initdb: could not change permissions of directory` 一类权限错误：

```bash
sudo chown -R 999:999 /web-project/my-blogs/data/postgres
```

999 是 postgres 官方镜像里 postgres 用户的 uid，可用 `docker run --rm postgres:18.6 id postgres` 确认。

## 四、放行端口

`blogs-app` 监听宿主 `8000`，需要在服务器防火墙和安全组放行 TCP 8000，否则 Netlify 代理和 Netlify 构建都连不上。

```bash
sudo ufw allow 8000/tcp        # 用 ufw 的话
```

云服务器还要在控制台安全组里放行。数据库端口不要对外放行。

## 五、启动

```bash
cd /web-project/my-blogs
docker compose up -d --build --wait --wait-timeout 120
docker compose logs -f blogs-app
```

首次构建要装 pip 依赖，可能要几分钟。`--wait` 会等 `pgsql` 变成 healthy、`blogs-app` 通过健康检查才返回，任何一个没就绪就以非零退出，比"命令成功但服务其实没起来"好排查；120 秒不够就改成 `--wait-timeout 300`。

**镜像来源**：`pgsql` 显式设了 `pull_policy: missing`，本地有 `postgres:18.6` 就直接用，缺了才去远端拉；`blogs-app` 是构建出来的，构建时默认也不拉取基础镜像，本地没有 `python:3.14.8-slim-trixie` 才需要 `docker pull`。所以正常部署过程中不会访问 Docker Hub。

日志里应依次出现：

```text
Applying blog.0001_initial... OK
Applying blog.0002_post_edited_at... OK
127 static files copied to '/app/staticfiles'.
Listening at: http://0.0.0.0:8000
```

验证：

```bash
docker compose ps
curl -s http://127.0.0.1:8000/api/v1/posts/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/v1/admin/posts/hello-world/
```

最后一条 `403`（未登录）才对。返回 404 说明代码不对；返回 500 通常是迁移没跑，执行 `docker compose exec blogs-app python manage.py migrate`。

## 六、建管理员并导入示例文章

```bash
docker compose exec blogs-app python manage.py createsuperuser
```

仓库里自带两篇 markdown，导入后首页就有内容：

```bash
docker cp /web-project/my-blogs/src/posts my-blogs-blogs-app-1:/tmp/seed-posts
docker compose exec blogs-app python manage.py import_posts /tmp/seed-posts
```

容器名形如 `my-blogs-blogs-app-1`，用 `docker ps` 可以确认。

## 七、配置 Netlify

1. `netlify.toml` 里的 `/api/*` 代理目标要指向服务器公网 IP。
2. 站点环境变量：`BLOG_API_BASE_URL=http://<服务器IP>:8000`，`VITE_API_BASE_URL` 留空。
3. `VITE_BASE_PATH` 和 `NODE_VERSION` 已写在 `netlify.toml`，不用在环境变量里重复设。

`VITE_API_BASE_URL` 一定要留空。填成后端地址会变成跨域直连，Cookie 属于第三方 Cookie，Safari 和 Chrome 会拦截，登录会随机失效。

Netlify 构建时会先执行 `sync-content` 拉取文章，所以构建期间后端必须能访问，否则构建直接失败。

## 日常更新

生产分支是 `main`，服务器停在这个分支上：

```bash
cd /web-project/my-blogs
git pull
docker compose up -d --build --wait --wait-timeout 120 blogs-app
```

迁移和静态文件收集由 `entrypoint.sh` 自动执行，不用手动跑。前端改动只要推到 GitHub，Netlify 会自动构建。

如果 `git pull` 报本地改动会被覆盖，说明有人在服务器上直接改了文件，先确认改动是否有用，再决定是提交还是丢弃：

```bash
git status
git checkout -- <文件>      # 丢弃服务器上的本地改动
git pull
```

## 备份

```bash
cd /web-project/my-blogs
docker compose exec -T pgsql pg_dump -U my_blogs my_blogs > ~/backup-$(date +%F).sql
```

数据落在宿主目录 `data/postgres`，容器删了重建数据都还在。要清理只删容器，不要手滑删掉这个目录。直接打包目录也可以，但必须先停 `pgsql` 容器，否则可能拿到不一致的快照，所以日常备份用 `pg_dump`。

建议加一个定时备份（`crontab -e`），每天凌晨 3 点导一次，只保留两周：

```bash
0 3 * * * cd /web-project/my-blogs && docker compose exec -T pgsql pg_dump -U my_blogs my_blogs > /root/backup/my_blogs-$(date +\%F).sql
30 3 * * * find /root/backup -name 'my_blogs-*.sql' -mtime +14 -delete
```

记得先 `mkdir -p /root/backup`。

## 常见问题

**登录后立刻掉登录态**：检查 `DJANGO_COOKIE_SECURE` 是否为 `0`，以及 `VITE_API_BASE_URL` 是否留空。

**Netlify 构建失败在 sync-content**：后端没起，或 8000 端口没放行，Netlify 构建机拉不到文章接口。

**前端 /api/ 返回 502**：`netlify.toml` 里的 IP 不对，或安全组没放行 8000。

**blogs-app 起不来，日志报 `failed to resolve host`**：`DB_HOST` 必须等于 PostgreSQL 的服务名，当前是 `pgsql`，改成别的名字就对不上了。

**容器起不来报目录权限错误**：见第三步的 `chown -R 999:999`。

**`git pull` 报本地改动会被覆盖**：见「日常更新」里的处理方式，根源是有人直接在服务器上改了受 Git 跟踪的文件。

**Admin 静态样式丢失**：看容器启动日志里 `collectstatic` 是否报错。

## 安全提醒

后端目前是明文 HTTP，Netlify 代理到服务器的这一段没有加密，管理员密码和会话 Cookie 会以明文经过公网。能用，但不理想。等你有域名之后，在服务器前面加一层 Caddy 自动申请 Let's Encrypt 证书，把 `netlify.toml` 的目标改成 `https://`，并把 `DJANGO_COOKIE_SECURE` 改回 `1`，这段风险就消掉了。
