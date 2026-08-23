import type { Config } from '@netlify/functions'
import { desc, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { storyComments, storyHearts } from '../../db/schema.js'
import { json, withErrorHandling } from './lib/http.js'

const MAX_STORIES = 12
const MAX_COMMENTS_PER_STORY = 5
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/

function cleanSlugs(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => SLUG_PATTERN.test(value)))].slice(
    0,
    MAX_STORIES,
  )
}

async function engagementFor(slugs: string[]) {
  const clean = cleanSlugs(slugs)
  if (clean.length === 0) return []

  const [heartRows, commentRows] = await Promise.all([
    db.select().from(storyHearts).where(inArray(storyHearts.storySlug, clean)),
    db
      .select()
      .from(storyComments)
      .where(inArray(storyComments.storySlug, clean))
      .orderBy(desc(storyComments.createdAt)),
  ])

  const heartsBySlug = new Map(heartRows.map((row) => [row.storySlug, row.heartCount]))
  const commentsBySlug = new Map<string, typeof commentRows>()

  for (const comment of commentRows) {
    const comments = commentsBySlug.get(comment.storySlug) || []
    if (comments.length < MAX_COMMENTS_PER_STORY) comments.push(comment)
    commentsBySlug.set(comment.storySlug, comments)
  }

  return clean.map((storySlug) => ({
    storySlug,
    hearts: heartsBySlug.get(storySlug) || 0,
    comments: (commentsBySlug.get(storySlug) || []).map((comment) => ({
      id: comment.id,
      author: comment.author,
      message: comment.message,
      createdAt: comment.createdAt.toISOString(),
    })),
  }))
}

export default withErrorHandling(async (req: Request) => {
  if (req.method === 'GET') {
    const slugs = new URL(req.url).searchParams.get('slugs')?.split(',') || []
    return json(await engagementFor(slugs))
  }

  if (req.method === 'POST') {
    const body = (await req.json().catch(() => null)) as
      | { action?: unknown; storySlug?: unknown; author?: unknown; message?: unknown }
      | null

    if (!body || typeof body.storySlug !== 'string' || !SLUG_PATTERN.test(body.storySlug)) {
      return json({ error: 'A valid story is required.' }, 400)
    }

    if (body.action === 'heart') {
      await db
        .insert(storyHearts)
        .values({ storySlug: body.storySlug, heartCount: 1 })
        .onConflictDoUpdate({
          target: storyHearts.storySlug,
          set: {
            heartCount: sql`${storyHearts.heartCount} + 1`,
            updatedAt: new Date(),
          },
        })

      return json((await engagementFor([body.storySlug]))[0])
    }

    if (body.action === 'comment') {
      const author = typeof body.author === 'string' ? body.author.trim().slice(0, 40) : ''
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 280) : ''
      if (!author || !message) return json({ error: 'A name and comment are required.' }, 400)

      await db.insert(storyComments).values({ storySlug: body.storySlug, author, message })
      return json((await engagementFor([body.storySlug]))[0], 201)
    }

    return json({ error: 'Unknown interaction.' }, 400)
  }

  return json({ error: 'Method not allowed' }, 405)
})

export const config: Config = {
  path: '/api/news-interactions',
}
