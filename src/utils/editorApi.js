// 本地走 Vite dev 中间件，线上走 Netlify Function（两者写入同样的 src/posts/*.md）
const isDev = import.meta.env.DEV
const BASE = isDev ? '/__blog__/posts' : '/.netlify/functions/posts'
const PASSWORD_KEY = 'blog-editor-password'

export function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || ''
}

export function setPassword(value) {
  localStorage.setItem(PASSWORD_KEY, value)
}

// dev 中间件用路径参数，线上 Function 用查询参数
const itemUrl = (slug) => (isDev ? `${BASE}/${slug}` : `${BASE}?slug=${encodeURIComponent(slug)}`)

async function request(url, method, data) {
  const headers = {}
  if (data) {
    headers['Content-Type'] = 'application/json'
  }
  const password = getPassword()
  if (password) {
    headers['X-Editor-Password'] = password
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  })

  let payload = {}
  try {
    payload = await response.json()
  } catch {
    // 非 JSON 响应时保留默认空对象
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || `请求失败（${response.status}）`)
  }

  return payload
}

export function createPost(data) {
  return request(BASE, 'POST', data)
}

export function updatePost(slug, data) {
  return request(itemUrl(slug), 'PUT', data)
}

export function deletePost(slug) {
  return request(itemUrl(slug), 'DELETE')
}