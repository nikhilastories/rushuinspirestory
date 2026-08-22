import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StoryCard from '../components/StoryCard'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/meta'
import type { StorySummary } from '../types'

export default function Home() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)

  usePageMeta()

  useEffect(() => {
    api
      .listPublished()
      .then((data) => setStories(data.slice(0, 3)))
      .catch(() => setStories([]))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero__scrim" aria-hidden="true" />
        <div className="container hero__inner">
          <h1>Atlas of Everyday Magic</h1>
          <p className="hero__subhead">Charting wonder from life&rsquo;s little moments</p>
          <p>
            Step into a world where tiny ideas grow wings, where ordinary moments open doors to extraordinary
            adventures, and every page holds a quiet wonder. Woven from a child&rsquo;s boundless daydreams, where
            imagination knows no boundaries, and a mother&rsquo;s magic turns dreams into stories. A world waiting to
            be found.
          </p>
          <p className="hero__closing">Dream the impossible. Imagine the unseen. Live the magic.</p>
          <div className="hero__actions">
            <Link to="/stories" className="btn btn-gold">
              Read the Stories
            </Link>
            <Link to="/authors-note" className="btn btn-secondary" style={{ borderColor: 'rgba(255,253,248,0.35)', color: 'var(--paper)' }}>
              Author&rsquo;s Note
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <span className="kicker">Fresh off the notebook</span>
            <h2>Latest tales</h2>
            <p>New stories are published as soon as they&rsquo;re ready &mdash; straight from Mama&rsquo;s drafts.</p>
          </div>

          {stories === null && (
            <div className="center-loader">
              <div className="spinner" />
            </div>
          )}

          {stories && stories.length === 0 && (
            <div className="empty-state">
              <h3>The first story is being written&hellip;</h3>
              <p>Check back soon &mdash; new adventures are on their way.</p>
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

      <section className="section section--alt">
        <div className="container">
          <div className="divider-stars">✦</div>
          <div className="section__head" style={{ marginTop: 24 }}>
            <span className="kicker">How it works</span>
            <h2>From a bedtime whisper to a published tale</h2>
            <p>
              Every story starts as a draft, gets a gentle once-over during review, and is only shared here once
              it&rsquo;s ready &mdash; each step saved and versioned in Mama&rsquo;s own storybook archive.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
