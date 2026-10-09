import assert from 'node:assert/strict'
import test from 'node:test'
import { pickWheelStory, storyWheelSegments, wheelRotation } from '../src/lib/story-wheel.ts'
import type { StorySummary } from '../src/types.ts'

const categories = [{ slug: 'dreams', label: 'Dreams' }, { slug: 'adventures', label: 'Adventures' }, { slug: 'empty', label: 'Empty' }]
const story = (slug: string, category?: string | string[], status: StorySummary['status'] = 'published'): StorySummary => ({
  slug, title: slug, category, status, excerpt: 'An adventure.', createdAt: '2026-10-09', updatedAt: '2026-10-09',
})

test('the wheel includes populated categories and supports multiple categories', () => {
  const segments = storyWheelSegments([story('first', 'dreams'), story('second', ['dreams', 'adventures'])], categories)
  assert.deepEqual(segments.map((segment) => segment.slug), ['dreams', 'adventures'])
  assert.deepEqual(segments[0].stories.map((item) => item.slug), ['first', 'second'])
  assert.equal(segments[1].stories[0].slug, 'second')
})

test('drafts and stories in review never appear on the wheel', () => {
  const segments = storyWheelSegments([story('draft', 'dreams', 'draft'), story('review', 'adventures', 'review')], categories)
  assert.deepEqual(segments, [])
  assert.equal(pickWheelStory(segments), null)
})

test('uncategorized and unknown-category stories have an Other Wonders segment', () => {
  const segments = storyWheelSegments([story('first'), story('second', 'unknown')], categories)
  assert.equal(segments.length, 1)
  assert.equal(segments[0].label, 'Other Wonders')
  assert.equal(segments[0].stories.length, 2)
})

test('a spin selects a category and then a story from that category', () => {
  const segments = storyWheelSegments([story('first', 'dreams'), story('second', 'adventures'), story('third', 'adventures')], categories)
  const randomValues = [0.9, 0.9]
  const result = pickWheelStory(segments, () => randomValues.shift()!)
  assert.equal(result?.segment.slug, 'adventures')
  assert.equal(result?.story.slug, 'third')
})

test('a single available story can always be selected', () => {
  const segments = storyWheelSegments([story('only', 'dreams')], categories)
  assert.equal(pickWheelStory(segments, () => 0)?.story.slug, 'only')
  assert.equal(pickWheelStory(segments, () => 0.999)?.story.slug, 'only')
})

test('every spin makes full turns and aligns its selected segment with the pointer', () => {
  for (const count of [1, 2, 5, 6]) {
    let rotation = 0
    for (let index = 0; index < count; index += 1) {
      const next = wheelRotation(rotation, index, count)
      assert.ok(next - rotation >= 1800)
      assert.ok(Math.abs(((index + 0.5) * 360 / count + next) % 360) < 0.000001)
      rotation = next
    }
  }
})
