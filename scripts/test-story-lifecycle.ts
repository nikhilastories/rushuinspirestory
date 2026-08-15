/**
 * Exercises the draft -> review -> published lifecycle against the real
 * serialization code. Run with: node --experimental-strip-types scripts/test-story-lifecycle.ts
 */
import assert from 'node:assert/strict'
import {
  nextStoryFrontmatter,
  parseStory,
  serializeStory,
  type StoryFrontmatter,
} from '../netlify/functions/lib/stories.ts'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

/** One PUT /api/stories/:slug round trip: read file -> apply update -> write file. */
function put(raw: string, updates: Record<string, unknown>, now: string): string {
  const { frontmatter, body } = parseStory(raw)
  const next = nextStoryFrontmatter(frontmatter, updates, now)
  return serializeStory(next, body)
}

const draft = serializeStory(
  {
    title: '2nd story on moong and orange',
    slug: '2nd-story-on-moong-and-orange',
    status: 'draft',
    excerpt: '2nd story on moong and orange',
    coverImage: '/api/images/2nd-story-on-moong-and-orange/cover.png',
    createdAt: '2026-08-15T15:42:41.566Z',
    updatedAt: '2026-08-15T15:42:41.566Z',
  } as StoryFrontmatter,
  'Once upon a time.',
)

console.log('\nstory lifecycle')

// The exact request the "Send to Review" button makes on a story that has never
// been published, i.e. one with no publishedAt key. This is what returned 502.
let review = ''
check('draft -> review does not throw', () => {
  review = put(draft, { status: 'review' }, '2026-08-16T09:00:00.000Z')
})

check('draft -> review keeps status and omits publishedAt', () => {
  const { frontmatter } = parseStory(review)
  assert.equal(frontmatter.status, 'review')
  assert.equal(frontmatter.updatedAt, '2026-08-16T09:00:00.000Z')
  assert.ok(!('publishedAt' in frontmatter), 'publishedAt must be absent, not undefined')
  assert.ok(!review.includes('undefined'), 'serialized file must not contain "undefined"')
})

check('draft -> review preserves title, body and cover image', () => {
  const { frontmatter, body } = parseStory(review)
  assert.equal(frontmatter.title, '2nd story on moong and orange')
  assert.equal(frontmatter.coverImage, '/api/images/2nd-story-on-moong-and-orange/cover.png')
  assert.equal(body, 'Once upon a time.')
})

let published = ''
check('review -> published does not throw', () => {
  published = put(review, { status: 'published' }, '2026-08-17T10:00:00.000Z')
})

check('review -> published stamps publishedAt', () => {
  const { frontmatter } = parseStory(published)
  assert.equal(frontmatter.status, 'published')
  assert.equal(frontmatter.publishedAt, '2026-08-17T10:00:00.000Z')
  assert.equal(frontmatter.updatedAt, '2026-08-17T10:00:00.000Z')
})

check('published -> review preserves the original publishedAt', () => {
  const back = put(published, { status: 'review' }, '2026-08-18T11:00:00.000Z')
  const { frontmatter } = parseStory(back)
  assert.equal(frontmatter.status, 'review')
  assert.equal(frontmatter.publishedAt, '2026-08-17T10:00:00.000Z')

  const again = put(back, { status: 'published' }, '2026-08-19T12:00:00.000Z')
  assert.equal(parseStory(again).frontmatter.publishedAt, '2026-08-17T10:00:00.000Z')
})

// A story with no cover image is the other undefined that reached the YAML dumper.
const noCover = serializeStory(
  {
    title: 'Plain story',
    slug: 'plain-story',
    status: 'draft',
    excerpt: '',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  } as StoryFrontmatter,
  'No cover here.',
)

check('a story with no cover image serializes', () => {
  const { frontmatter } = parseStory(noCover)
  assert.ok(!('coverImage' in frontmatter), 'coverImage must be absent, not undefined')
  assert.equal(frontmatter.excerpt, '', 'a required-but-empty excerpt is still written')
})

check('draft -> review -> published with no cover image', () => {
  const r = put(noCover, { status: 'review' }, '2026-08-16T09:00:00.000Z')
  assert.equal(parseStory(r).frontmatter.status, 'review')
  const p = put(r, { status: 'published' }, '2026-08-17T09:00:00.000Z')
  assert.equal(parseStory(p).frontmatter.status, 'published')
  assert.equal(parseStory(p).frontmatter.publishedAt, '2026-08-17T09:00:00.000Z')
})

check('clearing a cover image removes the key', () => {
  const cleared = put(draft, { coverImage: '' }, '2026-08-16T09:00:00.000Z')
  assert.ok(!('coverImage' in parseStory(cleared).frontmatter))
})

check('an unknown status is ignored rather than written', () => {
  const out = put(draft, { status: 'nonsense' }, '2026-08-16T09:00:00.000Z')
  assert.equal(parseStory(out).frontmatter.status, 'draft')
})

check('hand-written extra frontmatter keys survive a status change', () => {
  const withExtra = '---\n' +
    'title: Extra\nslug: extra\nstatus: draft\nexcerpt: e\n' +
    "createdAt: '2026-08-15T00:00:00.000Z'\nupdatedAt: '2026-08-15T00:00:00.000Z'\n" +
    'tags:\n  - bedtime\n---\n\nBody.\n'
  const out = put(withExtra, { status: 'review' }, '2026-08-16T09:00:00.000Z')
  assert.deepEqual((parseStory(out).frontmatter as Record<string, unknown>).tags, ['bedtime'])
})

console.log(`\n${passed} passed\n`)
