import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMarkdown } from '../shared/postMarkdown.js'

// 当前文件位于 vite/ 目录，文章目录在项目根的 src/posts 下
const here = fileURLToPath(import.meta.url)
const POSTS_DIR = path.resolve(path.dirname(here), '../src/posts')

// slug 同时是文件名，只允许 ASCII 字母、数字、连字符和下划线，防止路径穿越
const SLUG_RE = /^[A-Za-z0-9_-]+$/

function resolvePostFile(slug) {
  if (!slug || typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    return null
  }
  return path.resolve(POSTS_DIR, `${slug}.md`)
}

// 文件名用秒级时间戳；同一秒内重复创建时追加序号兜底，避免覆盖已有文章
function nextSlug() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const base =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

  let slug = base
  for (let i = 1; fs.existsSync(path.resolve(POSTS_DIR, `${slug}.md`)); i += 1) {
    slug = `${base}-${i}`
  }
  return slug
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) {
    return {}
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('请求体不是有效的 JSON')
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

// 仅在 dev server 启用的写文件 API，生产构建不会注册
export function blogPlugin() {
  return {
    name: 'blog-write-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')

        if (!url.pathname.startsWith('/__blog__/posts')) {
          return next()
        }

        try {
          fs.mkdirSync(POSTS_DIR, { recursive: true })

          if (req.method === 'GET') {
            return sendJson(res, 200, { ok: true, dir: POSTS_DIR })
          }

          if (req.method === 'POST') {
            const data = await readJson(req)
            // 文件名由服务端生成，前端不参与命名
            const slug = nextSlug()
            fs.writeFileSync(resolvePostFile(slug), buildMarkdown(data), 'utf8')
            return sendJson(res, 200, { ok: true, slug })
          }

          const slug = url.pathname.slice('/__blog__/posts'.length).replace(/^\/+/, '')
          const file = resolvePostFile(slug)

          if (!file) {
            return sendJson(res, 400, { ok: false, message: 'slug 不合法' })
          }

          if (req.method === 'PUT') {
            const data = await readJson(req)
            if (!fs.existsSync(file)) {
              return sendJson(res, 404, { ok: false, message: '文章不存在' })
            }
            fs.writeFileSync(file, buildMarkdown(data), 'utf8')
            return sendJson(res, 200, { ok: true, slug })
          }

          if (req.method === 'DELETE') {
            if (!fs.existsSync(file)) {
              return sendJson(res, 404, { ok: false, message: '文章不存在' })
            }
            fs.unlinkSync(file)
            return sendJson(res, 200, { ok: true, slug })
          }

          return sendJson(res, 405, { ok: false, message: '方法不支持' })
        } catch (error) {
          return sendJson(res, 500, { ok: false, message: error.message || '服务端错误' })
        }
      })
    },
  }
}