import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'blog-dark-mode'
const isDark = ref(false)

function apply(value) {
  document.documentElement.classList.toggle('dark', value)
}

// 深色模式：localStorage 持久化，默认跟随系统偏好
export function useDarkMode() {
  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    isDark.value =
      saved !== null ? saved === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches
    apply(isDark.value)
  })

  watch(isDark, (value) => {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    apply(value)
  })

  const toggle = () => {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
