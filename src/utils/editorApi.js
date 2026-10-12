import { apiRequest } from './api.js'

export function createPost(data) {
  return apiRequest('/api/v1/admin/posts/', {
    method: 'POST',
    body: data,
  })
}

export function getPost(slug) {
  return apiRequest(`/api/v1/admin/posts/${encodeURIComponent(slug)}/`)
}

export function updatePost(slug, data) {
  return apiRequest(`/api/v1/admin/posts/${encodeURIComponent(slug)}/`, {
    method: 'PUT',
    body: data,
  })
}

export function deletePost(slug) {
  return apiRequest(`/api/v1/admin/posts/${encodeURIComponent(slug)}/`, {
    method: 'DELETE',
  })
}

export function listDrafts() {
  return apiRequest('/api/v1/admin/drafts/')
}
