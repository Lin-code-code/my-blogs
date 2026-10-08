import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { syncContent } from './sync-content.mjs'

test('writes published posts and filters drafts', async () => {
  const published = {
    slug: 'published',
    title: '已发布',
    date: '2026-02-01',
    tags: ['Vue'],
    category: '技术',
    summary: '摘要',
    draft: false,
    content: '正文',
  }
  const server = http.createServer((req, res) => {
    if (req.url !== '/api/v1/posts/') {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([published, { ...published, slug: 'draft', draft: true }]))
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const dir = await mkdtemp(join(tmpdir(), 'blog-sync-'))
  const target = join(dir, 'posts.json')

  try {
    const posts = await syncContent({
      apiBase: `http://127.0.0.1:${port}`,
      target,
    })

    assert.equal(posts.length, 1)
    assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), [published])
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
