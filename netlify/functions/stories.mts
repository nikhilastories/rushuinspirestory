import type { Config } from '@netlify/functions'
import { getFile, isConfigured, listDir, putFile } from './lib/github.js'
import { requireAdmin } from './lib/auth.js'
import { json, withErrorHandling } from './lib/http.js'
import { parseStory, serializeStory, slugify, storyPath, STORIES_DIR, type StoryFrontmatter } from './lib/stories.js'

function toSummary(frontmatter: StoryFrontmatter) {
  const { title, slug, status, collection, excerpt, coverImage, createdAt, updatedAt, publishedAt } = frontmatter
  return { title, slug, status, collection, excerpt, coverImage, createdAt, updatedAt, publishedAt }
}

/** Untrusted request body for creating a story — every field is validated below. */
interface CreateStoryBody {
  title?: unknown
  collection?: unknown
  excerpt?: unknown
  coverImage?: unknown
  body?: unknown
}

export default withErrorHandling(async (req: Request) => {
  if (!isConfigured()) {
    return json(
      { error: 'The storybook is not connected to GitHub yet. Set a GITHUB_TOKEN environment variable to continue.' },
      503,
    )
  }

  if (req.method === 'GET') {
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    if (wantsAll) {
      const admin = await requireAdmin()
      if (!admin.ok) return admin.response!
    }

    const entries = await listDir(STORIES_DIR)
    const files = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'))

    const stories = await Promise.all(
      files.map(async (entry) => {
        const file = await getFile(entry.path)
        if (!file) return null
        try {
          const { frontmatter } = parseStory(file.content)
          return toSummary(frontmatter)
        } catch {
          return null
        }
      }),
    )

    const visible = stories.filter((s): s is ReturnType<typeof toSummary> => Boolean(s) && (wantsAll || s!.status === 'published'))
    visible.sort((a, b) => {
      const aDate = a.publishedAt || a.updatedAt || a.createdAt
      const bDate = b.publishedAt || b.updatedAt || b.createdAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    return json(visible)
  }

  if (req.method === 'POST') {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response!

    const body = (await req.json().catch(() => null)) as CreateStoryBody | null
    if (!body || typeof body.title !== 'string' || !body.title.trim()) {
      return json({ error: 'A title is required.' }, 400)
    }
    const title = body.title.trim()

    const baseSlug = slugify(title) || 'untitled-story'
    const existing = await listDir(STORIES_DIR)
    const existingSlugs = new Set(existing.filter((e) => e.type === 'file').map((e) => e.name.replace(/\.md$/, '')))
    let slug = baseSlug
    let counter = 2
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`
      counter += 1
    }

    const now = new Date().toISOString()
    const frontmatter: StoryFrontmatter = {
      title,
      slug,
      status: 'draft',
      collection:
        typeof body.collection === 'string' && body.collection.trim() ? body.collection.trim() : undefined,
      excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : '',
      coverImage: typeof body.coverImage === 'string' && body.coverImage ? body.coverImage : undefined,
      createdAt: now,
      updatedAt: now,
    }

    const markdown = typeof body.body === 'string' ? body.body : ''
    await putFile(storyPath(slug), serializeStory(frontmatter, markdown), `Start new story draft: ${frontmatter.title}`)

    return json({ ...frontmatter, body: markdown, sha: '' }, 201)
  }

  return json({ error: 'Method not allowed' }, 405)
})

export const config: Config = {
  path: '/api/stories',
}
