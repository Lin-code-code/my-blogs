import { computed, ref } from 'vue'
import { apiRequest } from './api.js'

const anonymous = () => ({ authenticated: false, username: '', is_staff: false })
const currentUser = ref(anonymous())

const isAuthenticated = computed(() => Boolean(currentUser.value.authenticated))
const isStaff = computed(() => Boolean(currentUser.value.is_staff))

export async function loadCurrentUser() {
  try {
    currentUser.value = await apiRequest('/api/v1/auth/me/')
  } catch {
    currentUser.value = anonymous()
  }
  return currentUser.value
}

export async function login(username, password) {
  currentUser.value = await apiRequest('/api/v1/auth/login/', {
    method: 'POST',
    body: { username, password },
  })
  return currentUser.value
}

export async function logout() {
  try {
    await apiRequest('/api/v1/auth/logout/', { method: 'POST' })
  } finally {
    currentUser.value = anonymous()
  }
}

export function useAuth() {
  return {
    currentUser,
    isAuthenticated,
    isStaff,
    loadCurrentUser,
    login,
    logout,
  }
}
