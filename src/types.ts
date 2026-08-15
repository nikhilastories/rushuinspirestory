export type StoryStatus = 'draft' | 'review' | 'published'

export interface StorySummary {
  slug: string
  title: string
  excerpt: string
  coverImage?: string
  status: StoryStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface StoryDetail extends StorySummary {
  body: string
  sha: string
}

export interface StoryInput {
  title: string
  excerpt: string
  body: string
  coverImage?: string
}
