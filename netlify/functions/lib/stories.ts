import matter from 'gray-matter'

export type StoryStatus = 'draft' | 'review' | 'published'

export const STORY_STATUSES: StoryStatus[] = ['draft', 'review', 'published']

export interface StoryFrontmatter {
  title: string
  slug: string
  status: StoryStatus
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

export function serializeStory(frontmatter: StoryFrontmatter, body: string): string {
  return matter.stringify(`\n${body.trim()}\n`, frontmatter)
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
