import type { Category } from './categories'
import type { StorySummary } from '../types'

export interface StoryWheelSegment extends Category {
  stories: StorySummary[]
}

export function storyWheelSegments(stories: StorySummary[], categories: Category[]): StoryWheelSegment[] {
  const published = stories.filter((story) => story.status === 'published')
  const slugsFor = (story: StorySummary) =>
    (Array.isArray(story.category) ? story.category : [story.category]).map((slug) => slug?.trim()).filter(Boolean)
  const segments = categories
    .map((category) => ({ ...category, stories: published.filter((story) => slugsFor(story).includes(category.slug)) }))
    .filter((segment) => segment.stories.length > 0)
  const otherStories = published.filter((story) =>
    !categories.some((category) => slugsFor(story).includes(category.slug)),
  )

  if (otherStories.length > 0) {
    segments.push({ slug: 'other-wonders', label: 'Other Wonders', stories: otherStories })
  }

  return segments
}

export function pickWheelStory(segments: StoryWheelSegment[], random = Math.random) {
  if (segments.length === 0) return null
  const index = Math.floor(random() * segments.length)
  const segment = segments[index]
  const story = segment.stories[Math.floor(random() * segment.stories.length)]
  return { index, segment, story }
}

export function wheelRotation(current: number, index: number, count: number): number {
  const target = (360 - (index + 0.5) * (360 / count)) % 360
  const offset = (target - (current % 360) + 360) % 360
  return current + 1800 + offset
}
