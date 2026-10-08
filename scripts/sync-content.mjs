import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export async function syncContent({ apiBase, target }) {
  const base = String(apiBase || '').replace(/\/$/, '')
  if (!base) {
    throw new Error('缺少 BLOG_API_BASE_URL')
  }

  const response = await fetch(`${base}/api/v1/posts/`)
  if (!response.ok) {
    throw new Error(`文章 API 请求失败：${response.status}`)
  }

  const payload = await response.json()
  if (!Array.isArray(payload)) {
    throw new Error('文章 API 必须返回数组')
  }

  const posts = payload.filter((post) => !post.draft)
  for (const post of posts) {
    if (!post.slug || !post.title || typeof post.content !== 'string') {
      throw new Error(`文章数据无效：${post.slug || '未知 slug'}`)
    }
  }

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')
  return posts
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = resolve(root, 'src/generated/posts.json')
  const posts = await syncContent({
    apiBase: process.env.BLOG_API_BASE_URL,
    target,
  })
  console.log(`已同步 ${posts.length} 篇文章`)
}
