const BASE = '/__blog__/posts'

async function request(pathname, method, data) {
  const response = await fetch(pathname, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
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
  return request(`${BASE}/${slug}`, 'PUT', data)
}

export function deletePost(slug) {
  return request(`${BASE}/${slug}`, 'DELETE')
}
