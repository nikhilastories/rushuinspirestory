import { useEffect, useState } from 'react'
import StoryCard from '../components/StoryCard'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/meta'
import type { StorySummary } from '../types'

interface Collection {
  name: string
  /** True when the shelf was named by the storyteller rather than inferred from a date. */
  curated: boolean
  stories: StorySummary[]
  latest: number
}

function storyDate(story: StorySummary): number {
  const date = story.publishedAt || story.updatedAt || story.createdAt
  const time = date ? new Date(date).getTime() : NaN
  return Number.isNaN(time) ? 0 : time
}

/**
 * Stories carry an optional `collection` in their frontmatter. Anything without
 * one still belongs somewhere, so it falls back to the year it was published —
 * every story lands on a shelf, and naming one is opt-in.
 */
function groupIntoCollections(stories: StorySummary[]): Collection[] {
  const groups = new Map<string, Collection>()

  for (const story of stories) {
    const named = story.collection?.trim()
    const time = storyDate(story)
    const name = named || (time ? `Stories from ${new Date(time).getFullYear()}` : 'Undated stories')
    const key = `${named ? 'named' : 'year'}:${name.toLowerCase()}`

    const group = groups.get(key)
    if (group) {
      group.stories.push(story)
      group.latest = Math.max(group.latest, time)
    } else {
      groups.set(key, { name, curated: Boolean(named), stories: [story], latest: time })
    }
  }

  for (const group of groups.values()) {
    group.stories.sort((a, b) => storyDate(b) - storyDate(a))
  }

  // Named shelves first, then the year fallbacks, each newest first.
  return [...groups.values()].sort((a, b) => {
    if (a.curated !== b.curated) return a.curated ? -1 : 1
    return b.latest - a.latest
  })
}

export default function Collections() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [error, setError] = useState('')

  usePageMeta(
    'Collections',
    'The shelves of the Atlas of Everyday Magic — stories gathered into collections, from one small wonder to the next.',
  )

  useEffect(() => {
    api
      .listPublished()
      .then(setStories)
      .catch((err) => setError(err.message))
  }, [])

  const collections = stories ? groupIntoCollections(stories) : []

  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <span className="kicker">Shelves of the atlas</span>
          <h2>Collections</h2>
          <p>Every story finds its shelf &mdash; gathered by theme where one has been given, and by year otherwise.</p>
        </div>

        {error && <div className="banner banner--error">{error}</div>}

        {!error && stories === null && (
          <div className="center-loader">
            <div className="spinner" />
          </div>
        )}

        {stories && stories.length === 0 && (
          <div className="empty-state">
            <h3>The shelves are still empty</h3>
            <p>The first collection appears as soon as a story is published.</p>
          </div>
        )}

        {collections.map((collection) => (
          <section key={collection.name} className="collection">
            <div className="collection__head">
              <h3>{collection.name}</h3>
              <span className="collection__count">
                {collection.stories.length} {collection.stories.length === 1 ? 'story' : 'stories'}
              </span>
            </div>
            <div className="story-grid">
              {collection.stories.map((story) => (
                <StoryCard key={story.slug} story={story} protectText />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
