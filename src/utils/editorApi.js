import { apiRequest } from './api.js'

export function createPost(data) {
  return apiRequest('/api/v1/admin/posts/', {
    method: 'POST',
    body: data,
  })
}
