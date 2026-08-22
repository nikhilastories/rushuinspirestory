import matter from 'gray-matter'

export type StoryStatus = 'draft' | 'review' | 'published'

export const STORY_STATUSES: StoryStatus[] = ['draft', 'review', 'published']

export interface StoryFrontmatter {
  title: string
  slug: string
  status: StoryStatus
  /** Optional shelf a story belongs to. Stories without one are grouped by year. */
  collection?: string
  excerpt: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface ParsedStory {
  frontmatter: StoryFrontmatter
  body: string
}

export const STORIES_DIR = 'content/stories'

export function storyPath(slug: string): string {
  return `${STORIES_DIR}/${slug}.md`
}

export function parseStory(raw: string): ParsedStory {
  const { data, content } = matter(raw)
  return { frontmatter: data as StoryFrontmatter, body: content.trim() }
}

/** Key order used when writing frontmatter, so files stay diff-friendly across edits. */
const FRONTMATTER_KEYS: (keyof StoryFrontmatter)[] = [
  'title',
  'slug',
  'status',
  'collection',
  'excerpt',
  'coverImage',
  'createdAt',
  'updatedAt',
  'publishedAt',
]

/** Optional fields: omitted entirely when empty rather than written as a blank value. */
const OPTIONAL_KEYS = new Set<string>(['collection', 'coverImage', 'publishedAt'])

/**
 * Drop fields that have no value. YAML cannot represent `undefined`, and handing one
 * to `matter.stringify` throws, so an absent `coverImage` or `publishedAt` must be
 * omitted from the object rather than set to undefined.
 */
function cleanFrontmatter(frontmatter: StoryFrontmatter): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}

  const write = (key: string, value: unknown) => {
    if (value === undefined || value === null) return
    if (OPTIONAL_KEYS.has(key) && typeof value === 'string' && !value.trim()) return
    cleaned[key] = value
  }

  for (const key of FRONTMATTER_KEYS) write(key, frontmatter[key])

  // Preserve any extra keys an author added by hand to the markdown file.
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!(FRONTMATTER_KEYS as string[]).includes(key)) write(key, value)
  }

  return cleaned
}

export function serializeStory(frontmatter: StoryFrontmatter, body: string): string {
  return matter.stringify(`\n${body.trim()}\n`, cleanFrontmatter(frontmatter))
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function isValidStatus(value: unknown): value is StoryStatus {
  return typeof value === 'string' && (STORY_STATUSES as string[]).includes(value)
}

/** The subset of an update request that has already been read off the wire. */
export interface StoryUpdate {
  title?: unknown
  collection?: unknown
  excerpt?: unknown
  coverImage?: unknown
  status?: unknown
}

/**
 * Build the frontmatter a story should have after an edit or a status change.
 * Kept pure so the draft → review → published transitions can be exercised
 * without a GitHub round trip.
 */
export function nextStoryFrontmatter(
  current: StoryFrontmatter,
  updates: StoryUpdate,
  now: string,
): StoryFrontmatter {
  const nextStatus = isValidStatus(updates.status) ? updates.status : current.status

  return {
    ...current,
    title: typeof updates.title === 'string' && updates.title.trim() ? updates.title.trim() : current.title,
    collection:
      typeof updates.collection === 'string' ? updates.collection.trim() || undefined : current.collection,
    excerpt: typeof updates.excerpt === 'string' ? updates.excerpt.trim() : current.excerpt,
    coverImage: typeof updates.coverImage === 'string' ? updates.coverImage || undefined : current.coverImage,
    status: nextStatus,
    updatedAt: now,
    // Stamped the first time a story reaches "published" and preserved afterwards,
    // so sending a published story back for review does not lose its original date.
    publishedAt: nextStatus === 'published' ? current.publishedAt || now : current.publishedAt,
  }
}
