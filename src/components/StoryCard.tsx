import { Link } from 'react-router-dom'
import type { StorySummary } from '../types'
import { formatDate } from '../lib/format'

export default function StoryCard({ story }: { story: StorySummary }) {
  return (
    <Link to={`/stories/${story.slug}`} className="story-card">
      <div className="story-card__media">
        {story.coverImage ? (
          <img src={story.coverImage} alt={story.title} loading="lazy" />
        ) : (
          <div className="story-card__media--empty">
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <path d="M40 14a20 20 0 1 0 10 36 16 16 0 0 1-10-36Z" fill="rgba(255,255,255,0.7)" />
            </svg>
          </div>
        )}
      </div>
      <div className="story-card__body">
        <span className="story-card__date">{formatDate(story.publishedAt || story.updatedAt)}</span>
        <h3 className="story-card__title">{story.title}</h3>
        <p className="story-card__excerpt">{story.excerpt}</p>
        <span className="story-card__read">Read the story →</span>
      </div>
    </Link>
  )
}
