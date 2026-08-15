import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StoryCard from '../components/StoryCard'
import { api } from '../lib/api'
import type { StorySummary } from '../types'

export default function Home() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)

  useEffect(() => {
    api
      .listPublished()
      .then((data) => setStories(data.slice(0, 3)))
      .catch(() => setStories([]))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero__moon" aria-hidden="true" />
        <div className="stars-scatter" aria-hidden="true">
          <span style={{ top: '18%', left: '62%', fontSize: '1.4rem', animationDelay: '0s' }}>✦</span>
          <span style={{ top: '34%', left: '78%', fontSize: '0.9rem', animationDelay: '1.1s' }}>✧</span>
          <span style={{ top: '58%', left: '68%', fontSize: '1.1rem', animationDelay: '2s' }}>✦</span>
        </div>
        <div className="container hero__inner">
          <span className="hero__eyebrow">✦ A bedtime storybook, written with love</span>
          <h1>
            A Son&rsquo;s <em>Spark</em>,<br />a Mother&rsquo;s <em>Magic</em>
          </h1>
          <p>
            Every night, Rushu asks a question, notices a bug in the garden, or invents an entire kingdom out of
            couch cushions. His mother writes down where his imagination goes. This is that collection &mdash; true
            tales, tall tales, and everything in between.
          </p>
          <div className="hero__actions">
            <Link to="/stories" className="btn btn-gold">
              Read the Stories
            </Link>
            <Link to="/about" className="btn btn-secondary" style={{ borderColor: 'rgba(255,253,248,0.35)', color: 'var(--paper)' }}>
              Meet Rushu
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
              <p>Check back soon &mdash; Rushu&rsquo;s adventures are on their way.</p>
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
