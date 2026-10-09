import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NewsWidget from '../components/NewsWidget'
import StoryWheel from '../components/StoryWheel'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/meta'
import type { StorySummary } from '../types'

export default function Home() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [storyLoadError, setStoryLoadError] = useState('')

  usePageMeta()

  const loadStories = useCallback(() => {
    setStories(null)
    setStoryLoadError('')
    api
      .listPublished()
      .then(setStories)
      .catch(() => {
        setStories([])
        setStoryLoadError('The stories couldn’t be loaded. Please try again.')
      })
  }, [])

  useEffect(loadStories, [loadStories])

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <span className="hero__eyebrow">A child&rsquo;s imagination. A mother&rsquo;s stories.</span>
          <h1>Atlas of <span>Everyday Magic.</span></h1>
          <p className="hero__subhead">Charting wonder from life&rsquo;s little moments</p>
          <div className="hero__actions">
            <Link to="/stories" className="btn btn-gold">
              Read the Stories <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/authors-note" className="btn btn-secondary">
              Author&rsquo;s Note <span aria-hidden="true">→</span>
            </Link>
          </div>
          <figure className="hero__artwork">
            <img
              src="/hero-atlas-of-everyday-magic.jpg"
              alt="A mother and child reading a glowing storybook beneath a castle, a rainbow, and a sky full of stars."
              width="2200"
              height="1136"
              fetchPriority="high"
            />
            <figcaption>Dream the impossible. Imagine the unseen. Live the magic.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section home-stories">
        <div className="container">
          <div className="home-section-head">
            <div className="section__head">
              <span className="kicker">Fresh off the notebook</span>
              <h2>Small moments.<br />Extraordinary tales.</h2>
              <p>New stories are published as soon as they&rsquo;re ready &mdash; straight from Mama&rsquo;s drafts.</p>
            </div>
            <Link to="/stories" className="text-link">Explore all stories <span aria-hidden="true">↗</span></Link>
          </div>

          <NewsWidget stories={stories === null ? null : stories.slice(0, 3)} />
        </div>
      </section>

      <StoryWheel stories={stories} error={storyLoadError} onRetry={loadStories} />

      <section className="section section--alt home-process">
        <div className="container">
          <div className="section__head">
            <span className="kicker">How it works</span>
            <h2>From a bedtime whisper to a published tale</h2>
            <p>
              Every story starts as a draft, gets a gentle once-over during review, and is only shared here once
              it&rsquo;s ready &mdash; each step saved and versioned in Mama&rsquo;s own storybook archive.
            </p>
          </div>
          <div className="process-grid">
            <article className="process-card process-card--intro">
              <span className="kicker">A world waiting to be found</span>
              <h3>Ordinary life.<br />Limitless imagination.</h3>
              <p>
                Step into a world where tiny ideas grow wings, where ordinary moments open doors to extraordinary
                adventures, and every page holds a quiet wonder. Woven from a child&rsquo;s boundless daydreams, where
                imagination knows no boundaries, and a mother&rsquo;s magic turns dreams into stories.
              </p>
              <Link to="/authors-note" className="text-link">Meet the storyteller <span aria-hidden="true">↗</span></Link>
            </article>
            <article className="process-card">
              <span className="process-card__number" aria-hidden="true">01</span>
              <h3>A little spark.</h3>
              <p>A bedtime whisper becomes an idea. Mama gives it a home in the drafts.</p>
              <span className="process-card__label">Imagine</span>
            </article>
            <article className="process-card">
              <span className="process-card__number" aria-hidden="true">02</span>
              <h3>A gentle polish.</h3>
              <p>Every tale gets a thoughtful once-over, with each version kept in the storybook archive.</p>
              <span className="process-card__label">Create</span>
            </article>
            <article className="process-card process-card--wide">
              <span className="process-card__number" aria-hidden="true">03</span>
              <h3>A world to share.</h3>
              <p>Once a story is ready, it joins the atlas. A new adventure, waiting for you.</p>
              <Link to="/collections" className="text-link">Find your next adventure <span aria-hidden="true">↗</span></Link>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}
