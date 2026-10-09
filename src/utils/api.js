const rawBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function apiUrl(path) {
  return `${rawBase}${path}`
}

function getCsrfToken() {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET'
  const headers = { ...(options.headers || {}) }
  let body = options.body

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  if (!['GET', 'HEAD'].includes(method)) {
    const csrf = getCsrfToken()
    if (csrf) headers['X-CSRFToken'] = csrf
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body,
    credentials: 'include',
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.message || `请求失败（${response.status}）`)
  }
  return payload
}
