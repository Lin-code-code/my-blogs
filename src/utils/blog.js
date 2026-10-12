import { computed, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import generatedPosts from '../generated/posts.json'
import { apiRequest } from './api.js'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre><code class="hljs language-${lang}">${hljs.highlight(code, { language: lang }).value}</code></pre>`
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>`
  },
})

md.renderer.rules.fence = (tokens, index, options) => {
  const token = tokens[index]
  const lang = token.info ? token.info.trim().split(/\s+/)[0] : ''
  const highlighted = options.highlight
    ? options.highlight(token.content, lang)
    : md.utils.escapeHtml(token.content)
  const encoded = encodeURIComponent(token.content)

  return `<div class="code-block"><button type="button" class="code-copy-button" data-code="${encoded}" aria-label="复制代码">复制</button>${highlighted}</div>`
}

// 统一时间显示：YYYY-MM-DD HH:mm:ss（本地时区）
export function formatDateTime(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 详情页和文章管理页共用：改过显示更新时间，没改过显示创建时间
export function postTimeLabel(post) {
  if (post.edited_at) {
    return `更新于 ${formatDateTime(post.edited_at)}`
  }
  const created = formatDateTime(post.created_at)
  return created ? `创建于 ${created}` : ''
}

function fallbackSummary(content) {
  return String(content || '')
    .replace(/[#>*`\-[\]]/g, '')
    .trim()
    .slice(0, 120)
}

function normalizePosts(items) {
  return items
    .filter((post) => !post.draft)
    .map((post) => ({
      ...post,
      summary: post.summary || fallbackSummary(post.content),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

const posts = ref(normalizePosts(generatedPosts))
let initialLoad = null

export async function loadPosts() {
  try {
    const payload = await apiRequest('/api/v1/posts/')
    if (Array.isArray(payload)) {
      posts.value = normalizePosts(payload)
    }
  } catch (error) {
    console.warn('[blog] 文章刷新失败，继续使用构建时数据:', error.message)
  }
  return posts.value
}

export function usePosts() {
  if (!initialLoad) {
    initialLoad = loadPosts()
  }

  const allPosts = computed(() => posts.value)
  const allTags = computed(() => [...new Set(posts.value.flatMap((post) => post.tags))].sort())
  const allCategories = computed(() => [...new Set(posts.value.map((post) => post.category))].sort())

  const latest = (n = 5) => computed(() => posts.value.slice(0, n))
  const getBySlug = (slug) => posts.value.find((post) => post.slug === slug)

  const search = (postsRef, keywordRef, tagRef, categoryRef) =>
    computed(() =>
      postsRef.value.filter((post) => {
        const keyword = (keywordRef.value || '').trim().toLowerCase()
        const matchKeyword =
          !keyword ||
          post.title.toLowerCase().includes(keyword) ||
          post.summary.toLowerCase().includes(keyword) ||
          post.tags.some((tag) => tag.toLowerCase().includes(keyword))
        const matchTag = !tagRef.value || post.tags.includes(tagRef.value)
        const matchCategory = !categoryRef.value || post.category === categoryRef.value
        return matchKeyword && matchTag && matchCategory
      })
    )

  const neighbors = (slug) => {
    const index = posts.value.findIndex((post) => post.slug === slug)
    return {
      prev: index > 0 ? posts.value[index - 1] : null,
      next: index >= 0 && index < posts.value.length - 1 ? posts.value[index + 1] : null,
    }
  }

  return {
    allPosts,
    allTags,
    allCategories,
    latest,
    getBySlug,
    search,
    neighbors,
    loadPosts,
    render: (content) => md.render(content),
  }
}

