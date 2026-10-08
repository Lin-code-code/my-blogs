import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import yaml from 'js-yaml'
// 只引入常用语言，避免把 highlight.js 全量语言包打进产物
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'

// markdown 渲染器，代码块走 highlight.js 高亮
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

// 构建期扫描 src/posts 目录下所有 markdown 文件
const modules = import.meta.glob('/src/posts/*.md', { eager: true, query: '?raw', import: 'default' })

// gray-matter 依赖 Node 的 Buffer，无法在浏览器运行，这里用 js-yaml 自行解析 frontmatter
function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)

  if (!/^---[ \t]*$/.test(lines[0] || '')) {
    return { data: {}, content: text }
  }

  const end = lines.findIndex((line, index) => index > 0 && /^---[ \t]*$/.test(line))
  if (end === -1) {
    return { data: {}, content: text }
  }

  let data = {}
  try {
    data = yaml.load(lines.slice(1, end).join('\n')) || {}
  } catch (error) {
    console.warn('[blog] frontmatter 解析失败:', error.message)
  }

  return { data, content: lines.slice(end + 1).join('\n') }
}

function parsePosts() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      const slug = path.split('/').pop().replace(/\.md$/, '')
      return {
        slug,
        title: data.title || slug,
        date: data.date ? String(data.date) : '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: data.category || '未分类',
        draft: data.draft === true,
        summary: data.summary || content.replace(/[#>*`\-[\]]/g, '').trim().slice(0, 120),
        content,
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

const posts = parsePosts()
// 草稿不进入列表、首页和上下篇导航，但保留在 posts 里供直链预览与编辑
const published = posts.filter((p) => !p.draft)

// 全部文章（按日期倒序，不含草稿）
export function usePosts() {
  const allPosts = computed(() => published)
  const allTags = computed(() => [...new Set(published.flatMap((p) => p.tags))].sort())
  const allCategories = computed(() => [...new Set(published.map((p) => p.category))].sort())

  const latest = (n = 5) => computed(() => published.slice(0, n))
  // 直链可以打开草稿做预览，列表里不展示
  const getBySlug = (slug) => posts.find((p) => p.slug === slug)

  // 按关键词（标题/摘要/标签）过滤
  const search = (postsRef, keywordRef, tagRef, categoryRef) =>
    computed(() =>
      postsRef.value.filter((p) => {
        const kw = (keywordRef.value || '').trim().toLowerCase()
        const matchKw =
          !kw ||
          p.title.toLowerCase().includes(kw) ||
          p.summary.toLowerCase().includes(kw) ||
          p.tags.some((t) => t.toLowerCase().includes(kw))
        const matchTag = !tagRef.value || p.tags.includes(tagRef.value)
        const matchCat = !categoryRef.value || p.category === categoryRef.value
        return matchKw && matchTag && matchCat
      })
    )

  // 上一篇 / 下一篇
  const neighbors = (slug) => {
    const idx = published.findIndex((p) => p.slug === slug)
    return {
      prev: idx > 0 ? published[idx - 1] : null, // 更新的文章
      next: idx >= 0 && idx < published.length - 1 ? published[idx + 1] : null, // 更早的文章
    }
  }

  const render = (content) => md.render(content)

  return { allPosts, allTags, allCategories, latest, getBySlug, search, neighbors, render }
}