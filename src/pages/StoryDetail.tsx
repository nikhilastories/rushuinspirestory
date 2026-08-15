import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { renderMarkdown } from '../lib/markdown'
import { formatDate } from '../lib/format'
import type { StoryDetail as StoryDetailType } from '../types'

export default function StoryDetail() {
  const { slug = '' } = useParams()
  const [story, setStory] = useState<StoryDetailType | null | 'not-found'>(null)

  useEffect(() => {
    setStory(null)
    api
      .getStory(slug)
      .then(setStory)
      .catch(() => setStory('not-found'))
  }, [slug])

  if (story === null) {
    return (
      <div className="center-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (story === 'not-found') {
    return (
      <div className="story-detail">
        <div className="empty-state">
          <h3>This story hasn&rsquo;t been told yet</h3>
          <p>It may still be a draft, or the link may be out of date.</p>
          <Link to="/stories" className="btn btn-secondary" style={{ marginTop: 20 }}>
            Back to Stories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="story-detail fade-in">
      <Link to="/stories" className="story-detail__back">
        ← Back to Stories
      </Link>
      <span className="kicker">A tale for Rushu</span>
      <h1>{story.title}</h1>
      <div className="story-detail__meta">{formatDate(story.publishedAt || story.updatedAt)}</div>
      {story.coverImage && <img className="story-detail__cover" src={story.coverImage} alt={story.title} />}
      <div className="story-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(story.body) }} />
    </article>
  )
}
