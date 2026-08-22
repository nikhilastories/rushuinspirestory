import type { Config, Context } from '@netlify/functions'
import { deleteFile, getFile, isConfigured, putFile } from './lib/github.js'
import { isAdmin, requireAdmin } from './lib/auth.js'
import { json, withErrorHandling } from './lib/http.js'
import { nextStoryFrontmatter, parseStory, serializeStory, storyPath } from './lib/stories.js'

/** Untrusted request body for updating a story — every field is validated below. */
interface UpdateStoryBody {
  title?: unknown
  collection?: unknown
  category?: unknown
  excerpt?: unknown
  coverImage?: unknown
  status?: unknown
  body?: unknown
}

export default withErrorHandling(async (req: Request, context: Context) => {
  if (!isConfigured()) {
    return json({ error: 'The storybook is not connected to GitHub yet.' }, 503)
  }

  const slug = context.params.slug
  if (!slug) return json({ error: 'Missing story slug.' }, 400)

  const path = storyPath(slug)

  if (req.method === 'GET') {
    const file = await getFile(path)
    if (!file) return json({ error: 'Story not found.' }, 404)

    const { frontmatter, body } = parseStory(file.content)

    if (frontmatter.status !== 'published') {
      const admin = await isAdmin()
      if (!admin) return json({ error: 'Story not found.' }, 404)
    }

    return json({ ...frontmatter, body, sha: file.sha })
  }

  if (req.method === 'PUT') {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response!

    const existing = await getFile(path)
    if (!existing) return json({ error: 'Story not found.' }, 404)

    const { frontmatter: current, body: currentBody } = parseStory(existing.content)
    const updates = (await req.json().catch(() => ({}))) as UpdateStoryBody

    const now = new Date().toISOString()
    const nextFrontmatter = nextStoryFrontmatter(current, updates, now)
    const nextStatus = nextFrontmatter.status

    const nextBody = typeof updates.body === 'string' ? updates.body : currentBody

    const message =
      nextStatus !== current.status
        ? `Move "${nextFrontmatter.title}" from ${current.status} to ${nextStatus}`
        : `Update story: ${nextFrontmatter.title}`

    const result = await putFile(path, serializeStory(nextFrontmatter, nextBody), message, existing.sha)

    return json({ ...nextFrontmatter, body: nextBody, sha: result.sha })
  }

  if (req.method === 'DELETE') {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response!

    const existing = await getFile(path)
    if (!existing) return json({ error: 'Story not found.' }, 404)

    const { frontmatter } = parseStory(existing.content)
    await deleteFile(path, existing.sha, `Delete story: ${frontmatter.title}`)

    return new Response(null, { status: 204 })
  }

  return json({ error: 'Method not allowed' }, 405)
})

export const config: Config = {
  path: '/api/stories/:slug',
}
