import { useEffect, useMemo, useState } from 'react'
import StoryCard from '../components/StoryCard'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/meta'
import { CATEGORIES, toCategorySlugs, type Category } from '../lib/categories'
import type { StorySummary } from '../types'

const UNCATEGORISED: Category = { slug: '__uncategorised', label: 'Everything else' }

interface CategoryGroup {
  category: Category
  stories: StorySummary[]
}

/**
 * Groups stories by the categories declared in categories.json, in the order that
 * file lists them. Nothing here knows a category name: adding one to the JSON adds
 * a filter chip and a section with no change to this component. A story with several
 * categories appears under each of them.
 */
function groupByCategory(stories: StorySummary[]): CategoryGroup[] {
  const buckets = new Map<string, StorySummary[]>()

  for (const story of stories) {
    const slugs = toCategorySlugs(story.category)
    const keys = slugs.length > 0 ? slugs : [UNCATEGORISED.slug]
    for (const key of keys) {
      const bucket = buckets.get(key)
      if (bucket) bucket.push(story)
      else buckets.set(key, [story])
    }
  }

  // Slugs a story names but categories.json does not list. The build fails on these,
  // so this only shows up in a dev preview — surfacing them beats hiding the stories.
  const unlisted = [...buckets.keys()]
    .filter((slug) => slug !== UNCATEGORISED.slug && !CATEGORIES.some((c) => c.slug === slug))
    .map((slug) => ({ slug, label: slug }))

  return [...CATEGORIES, ...unlisted, UNCATEGORISED]
    .map((category) => ({ category, stories: buckets.get(category.slug) ?? [] }))
    .filter((group) => group.stories.length > 0)
}

export default function Stories() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState<string>('all')

  usePageMeta(
    'Stories',
    'Every story in the Atlas of Everyday Magic — a growing shelf of tales charting wonder from life’s little moments.',
  )

  useEffect(() => {
    api
      .listPublished()
      .then(setStories)
      .catch((err) => setError(err.message))
  }, [])

  const groups = useMemo(() => (stories ? groupByCategory(stories) : []), [stories])
  const visible = active === 'all' ? groups : groups.filter((group) => group.category.slug === active)

  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <span className="kicker">The full collection</span>
          <h2>Every Story in the Atlas</h2>
          <p>A growing shelf of tales, gathered by the kind of wonder each one begins with.</p>
        </div>

        {error && <div className="banner banner--error">{error}</div>}

        {!error && stories === null && (
          <div className="center-loader">
            <div className="spinner" />
          </div>
        )}

        {stories && stories.length === 0 && (
          <div className="empty-state">
            <h3>No stories published just yet</h3>
            <p>Mama is still writing &mdash; the first tale will appear here soon.</p>
          </div>
        )}

        {groups.length > 1 && (
          <div className="category-filter" role="group" aria-label="Filter stories by category">
            <button
              type="button"
              className={`category-chip${active === 'all' ? ' category-chip--active' : ''}`}
              aria-pressed={active === 'all'}
              onClick={() => setActive('all')}
            >
              All stories
            </button>
            {groups.map(({ category, stories: inCategory }) => (
              <button
                key={category.slug}
                type="button"
                className={`category-chip${active === category.slug ? ' category-chip--active' : ''}`}
                aria-pressed={active === category.slug}
                onClick={() => setActive(category.slug)}
              >
                {category.label} <span className="category-chip__count">{inCategory.length}</span>
              </button>
            ))}
          </div>
        )}

        {visible.map(({ category, stories: inCategory }) => (
          <section key={category.slug} className="collection">
            <div className="collection__head">
              <h3>{category.label}</h3>
              <span className="collection__count">
                {inCategory.length} {inCategory.length === 1 ? 'story' : 'stories'}
              </span>
            </div>
            <div className="story-grid">
              {inCategory.map((story) => (
                <StoryCard key={story.slug} story={story} protectText />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
