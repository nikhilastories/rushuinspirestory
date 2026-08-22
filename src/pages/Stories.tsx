import { useEffect, useState } from 'react'
import StoryCard from '../components/StoryCard'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/meta'
import type { StorySummary } from '../types'

export default function Stories() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [error, setError] = useState('')

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

  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <span className="kicker">The full collection</span>
          <h2>Every Story in the Atlas</h2>
          <p>A growing shelf of tales inspired by one very curious little boy.</p>
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

        {stories && stories.length > 0 && (
          <div className="story-grid">
            {stories.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
