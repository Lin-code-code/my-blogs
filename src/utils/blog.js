import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import generatedPosts from '../generated/posts.json'

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

function fallbackSummary(content) {
  return String(content || '')
    .replace(/[#>*`\-[\]]/g, '')
    .trim()
    .slice(0, 120)
}

const posts = generatedPosts
  .filter((post) => !post.draft)
  .map((post) => ({
    ...post,
    summary: post.summary || fallbackSummary(post.content),
  }))
  .sort((a, b) => (a.date < b.date ? 1 : -1))

export function usePosts() {
  const allPosts = computed(() => posts)
  const allTags = computed(() => [...new Set(posts.flatMap((post) => post.tags))].sort())
  const allCategories = computed(() => [...new Set(posts.map((post) => post.category))].sort())

  const latest = (n = 5) => computed(() => posts.slice(0, n))
  const getBySlug = (slug) => posts.find((post) => post.slug === slug)

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
    const index = posts.findIndex((post) => post.slug === slug)
    return {
      prev: index > 0 ? posts[index - 1] : null,
      next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
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
    render: (content) => md.render(content),
  }
}
