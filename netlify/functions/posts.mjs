import crypto from 'node:crypto'
import { buildMarkdown } from '../../shared/postMarkdown.js'

// 线上写文章后端：校验口令后，用 GitHub Contents API 把 Markdown 提交进仓库，
// 由 Netlify / GitHub Pages 的自动构建把新文章带上线（约 1-2 分钟）。
const OWNER = 'Lin-code-code'
const REPO = 'my-blogs'
const BRANCH = 'main'
const POSTS_DIR = 'src/posts'
const API = 'https://api.github.com'
const BODY_LIMIT = 200 * 1024
// slug 同时是文件名，限制字符集防止路径穿越
const SLUG_RE = /^[A-Za-z0-9_-]+$/

function env(key) {
  return globalThis.Netlify?.env?.get(key) || process.env[key] || ''
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

// 先做 sha256 摘要再定长比较，避免长度和内容差异造成时序泄露
function sameSecret(got, expected) {
  const digest = (value) => crypto.createHash('sha256').update(String(value)).digest()
  return crypto.timingSafeEqual(digest(got), digest(expected))
}

async function gh(pathname, options = {}) {
  const response = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'lin-blog-editor',
      ...(options.headers || {}),
    },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data }
}

const filePath = (slug) => `/repos/${OWNER}/${REPO}/contents/${POSTS_DIR}/${slug}.md`

async function currentSha(slug) {
  const res = await gh(`${filePath(slug)}?ref=${BRANCH}`)
  return res.ok ? res.data.sha : ''
}

// 文件名用秒级时间戳；同一秒重复创建时追加序号兜底
async function nextSlug() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const base =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

  let slug = base
  for (let i = 1; await currentSha(slug); i += 1) {
    slug = `${base}-${i}`
  }
  return slug
}

async function readBody(req) {
  const raw = await req.text()
  if (raw.length > BODY_LIMIT) {
    return { error: '正文过长（上限 200KB）' }
  }
  try {
    return { data: JSON.parse(raw) }
  } catch {
    return { error: '请求体不是有效的 JSON' }
  }
}

async function putFile(slug, raw, sha, message) {
  return gh(filePath(slug), {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(raw, 'utf8').toString('base64'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
}

export default async (req) => {
  if (!env('GITHUB_TOKEN') || !env('EDITOR_PASSWORD')) {
    return json(500, { ok: false, message: '服务端缺少 GITHUB_TOKEN 或 EDITOR_PASSWORD' })
  }

  if (!sameSecret(req.headers.get('x-editor-password') || '', env('EDITOR_PASSWORD'))) {
    return json(401, { ok: false, message: '编辑口令不正确' })
  }

  const slug = new URL(req.url).searchParams.get('slug') || ''
  if (slug && !SLUG_RE.test(slug)) {
    return json(400, { ok: false, message: 'slug 不合法' })
  }

  try {
    if (req.method === 'GET') {
      return json(200, { ok: true, repo: `${OWNER}/${REPO}`, branch: BRANCH })
    }

    if (req.method === 'POST') {
      const { data, error } = await readBody(req)
      if (error) {
        return json(400, { ok: false, message: error })
      }
      const created = await nextSlug()
      const res = await putFile(created, buildMarkdown(data), '', `content: 新增文章 ${created}`)
      if (!res.ok) {
        return json(res.status, { ok: false, message: res.data?.message || `GitHub 返回 ${res.status}` })
      }
      return json(200, { ok: true, slug: created })
    }

    if (req.method === 'PUT') {
      if (!slug) {
        return json(400, { ok: false, message: '缺少 slug' })
      }
      const { data, error } = await readBody(req)
      if (error) {
        return json(400, { ok: false, message: error })
      }
      const sha = await currentSha(slug)
      if (!sha) {
        return json(404, { ok: false, message: '文章不存在' })
      }
      const res = await putFile(slug, buildMarkdown(data), sha, `content: 更新文章 ${slug}`)
      if (!res.ok) {
        return json(res.status, { ok: false, message: res.data?.message || `GitHub 返回 ${res.status}` })
      }
      return json(200, { ok: true, slug })
    }

    if (req.method === 'DELETE') {
      if (!slug) {
        return json(400, { ok: false, message: '缺少 slug' })
      }
      const sha = await currentSha(slug)
      if (!sha) {
        return json(404, { ok: false, message: '文章不存在' })
      }
      const res = await gh(filePath(slug), {
        method: 'DELETE',
        body: JSON.stringify({ message: `content: 删除文章 ${slug}`, sha, branch: BRANCH }),
      })
      if (!res.ok) {
        return json(res.status, { ok: false, message: res.data?.message || `GitHub 返回 ${res.status}` })
      }
      return json(200, { ok: true, slug })
    }

    return json(405, { ok: false, message: '方法不支持' })
  } catch (error) {
    return json(500, { ok: false, message: error.message || '服务端错误' })
  }
}