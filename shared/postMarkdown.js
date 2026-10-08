// 用 JSON 字符串作为 YAML 双引号标量，避免日期、冒号、引号等产生解析歧义
export function yamlScalar(value) {
  return JSON.stringify(String(value ?? ''))
}

// 生成文章 Markdown（frontmatter + 正文）。
// 本地 dev 中间件与线上 Netlify Function 共用，保证两条写入路径产出格式一致。
export function buildMarkdown(data) {
  const title = yamlScalar(data.title || '未命名')
  const date = yamlScalar(data.date || new Date().toISOString().slice(0, 10))
  const category = yamlScalar(data.category || '未分类')
  const summary = yamlScalar(data.summary || '')
  const tags = (Array.isArray(data.tags) ? data.tags.filter(Boolean) : []).map((tag) =>
    yamlScalar(tag)
  )

  return [
    '---',
    `title: ${title}`,
    `date: ${date}`,
    `tags: [${tags.join(', ')}]`,
    `category: ${category}`,
    `summary: ${summary}`,
    `draft: ${data.draft ? 'true' : 'false'}`,
    '---',
    '',
    String(data.content || '').trimEnd(),
    '',
  ].join('\n')
}