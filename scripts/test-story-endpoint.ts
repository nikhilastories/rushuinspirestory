/**
 * Drives the real PUT /api/stories/:slug handler exported by story.mts, with the
 * GitHub and Identity layers swapped for in-memory fixtures. This is the closest
 * reproduction of the failing "Send to Review" request that can run without a
 * signed-in Identity session, and it exercises the actual serialization and
 * error-handling code the deployed function uses.
 *
 * Run with: node --experimental-strip-types --test scripts/test-story-endpoint.ts
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { GitHubContentError } from './fixtures/github.ts'
import { commits, failure, repo, reset } from './fixtures/state.ts'

const fixture = (name: string) => new URL(`./fixtures/${name}.ts`, import.meta.url).href

/**
 * The functions import sibling modules as `./lib/x.js` (or `./x.js` from within
 * lib/), which only Netlify's bundler resolves back to the `.ts` source. Map those
 * specifiers here, and redirect the two boundary modules to fixtures. Matching is
 * on the trailing filename so both spellings of the same import land on one module
 * instance — otherwise `instanceof GitHubContentError` would compare two classes.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/(^|\/)github\.js$/.test(specifier)) return { url: fixture('github'), shortCircuit: true }
    if (/(^|\/)auth\.js$/.test(specifier)) return { url: fixture('auth'), shortCircuit: true }

    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
      const candidate = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL)
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true }
    }

    return nextResolve(specifier, context)
  },
})

const storyModule = pathToFileURL('netlify/functions/story.mts').href
const { default: storyHandler } = (await import(storyModule)) as {
  default: (req: Request, context: unknown) => Promise<Response>
}

const SLUG = '2nd-story-on-moong-and-orange'
const PATH = `content/stories/${SLUG}.md`

/** The draft exactly as it exists in the repository today: no publishedAt key. */
const DRAFT = `---
title: 2nd story on moong and orange
slug: ${SLUG}
status: draft
excerpt: 2nd story on moong and orange
coverImage: >-
  /api/images/${SLUG}/screenshot.png
createdAt: '2026-08-15T15:42:41.566Z'
updatedAt: '2026-08-15T15:42:41.566Z'
---

2nd story on moong and orange
`

function call(method: string, body?: unknown) {
  return storyHandler(
    new Request(`https://example.com/api/stories/${SLUG}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    { params: { slug: SLUG } },
  )
}

test('Send to Review: draft -> review returns 200 instead of crashing', async () => {
  reset()
  repo.set(PATH, DRAFT)

  const res = await call('PUT', { status: 'review' })
  const payload = await res.json()

  assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(payload)}`)
  assert.equal(payload.status, 'review')
  assert.equal(payload.title, '2nd story on moong and orange')
  assert.equal(payload.body, '2nd story on moong and orange')

  const written = repo.get(PATH)!
  assert.match(written, /status: review/)
  assert.ok(!written.includes('publishedAt'), 'publishedAt must not be written yet')
  assert.ok(!written.includes('undefined'), 'no undefined may leak into the file')
  assert.match(written, /coverImage:/)
  assert.equal(commits.at(-1), 'Move "2nd story on moong and orange" from draft to review')
})

test('review -> published returns 200 and stamps publishedAt', async () => {
  const res = await call('PUT', { status: 'published' })
  const payload = await res.json()

  assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(payload)}`)
  assert.equal(payload.status, 'published')
  assert.ok(payload.publishedAt, 'publishedAt should be set on publish')

  const written = repo.get(PATH)!
  assert.match(written, /status: published/)
  assert.match(written, /publishedAt:/)
  assert.equal(commits.at(-1), 'Move "2nd story on moong and orange" from review to published')
})

test('the published story is then readable over GET', async () => {
  const res = await call('GET')
  const payload = await res.json()

  assert.equal(res.status, 200)
  assert.equal(payload.status, 'published')
  assert.equal(payload.body, '2nd story on moong and orange')
})

test('draft -> review -> published also works with no cover image', async () => {
  reset()
  repo.set(
    PATH,
    `---\ntitle: Plain\nslug: ${SLUG}\nstatus: draft\nexcerpt: ''\n` +
      `createdAt: '2026-08-15T00:00:00.000Z'\nupdatedAt: '2026-08-15T00:00:00.000Z'\n---\n\nPlain body.\n`,
  )

  const toReview = await call('PUT', { status: 'review' })
  assert.equal(toReview.status, 200, await toReview.clone().text())
  assert.equal((await toReview.json()).status, 'review')

  const toPublished = await call('PUT', { status: 'published' })
  assert.equal(toPublished.status, 200, await toPublished.clone().text())
  const payload = await toPublished.json()
  assert.equal(payload.status, 'published')
  assert.ok(payload.publishedAt)
})

test('editing content while sending to review keeps both changes', async () => {
  reset()
  repo.set(PATH, DRAFT)

  const res = await call('PUT', { status: 'review', title: 'Moong and Orange', body: 'A new draft.' })
  const payload = await res.json()

  assert.equal(res.status, 200)
  assert.equal(payload.title, 'Moong and Orange')
  assert.equal(payload.body, 'A new draft.')
  assert.equal(payload.status, 'review')
})

test('every transition the dashboard buttons can trigger returns 200', async () => {
  // Back to Draft, Unpublish, and re-Publish, in the order the UI allows them.
  const steps: { to: 'draft' | 'review' | 'published'; expectPublishedAt: boolean }[] = [
    { to: 'review', expectPublishedAt: false },
    { to: 'draft', expectPublishedAt: false },
    { to: 'review', expectPublishedAt: false },
    { to: 'published', expectPublishedAt: true },
    { to: 'review', expectPublishedAt: true },
    { to: 'published', expectPublishedAt: true },
  ]

  reset()
  repo.set(PATH, DRAFT)

  let firstPublishedAt = ''
  for (const step of steps) {
    const res = await call('PUT', { status: step.to })
    const payload = await res.json()

    assert.equal(res.status, 200, `${step.to} returned ${res.status}: ${JSON.stringify(payload)}`)
    assert.equal(payload.status, step.to)
    assert.equal(
      Boolean(payload.publishedAt),
      step.expectPublishedAt,
      `publishedAt presence wrong after moving to ${step.to}`,
    )
    assert.ok(!repo.get(PATH)!.includes('undefined'))

    if (step.expectPublishedAt) {
      firstPublishedAt ||= payload.publishedAt
      assert.equal(payload.publishedAt, firstPublishedAt, 'the original publish date must be kept')
    }
  }
})

test('an upstream GitHub failure returns a readable JSON error, not an empty 502', async () => {
  reset()
  repo.set(PATH, DRAFT)
  failure.next = new GitHubContentError('Could not save: 401 Bad credentials', 401)

  const res = await call('PUT', { status: 'review' })
  const payload = await res.json()

  assert.equal(res.status, 502)
  assert.ok(payload.error, 'a 502 must still carry a message the dashboard can display')
  assert.match(payload.error, /GITHUB_TOKEN/)
  assert.ok(!payload.error.includes('Bad credentials'), 'the raw GitHub body is not forwarded')
})

test('a newly created story with no cover image can be sent straight to review', async () => {
  reset()

  const storiesModule = pathToFileURL('netlify/functions/stories.mts').href
  const { default: storiesHandler } = (await import(storiesModule)) as {
    default: (req: Request) => Promise<Response>
  }

  const created = await storiesHandler(
    new Request('https://example.com/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '2nd story on moong and orange', excerpt: '', body: 'Draft text.' }),
    }),
  )
  const createdPayload = await created.json()
  assert.equal(created.status, 201, `create returned ${created.status}: ${JSON.stringify(createdPayload)}`)

  const written = repo.get(PATH)!
  assert.ok(!written.includes('undefined'), 'a story created without a cover image must still serialize')

  const res = await call('PUT', { status: 'review' })
  assert.equal(res.status, 200, await res.clone().text())
  assert.equal((await res.json()).status, 'review')
})
