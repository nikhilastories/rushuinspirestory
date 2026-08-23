import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'
import type { StoryEngagement, StorySummary } from '../types'

interface NewsWidgetProps {
  stories: StorySummary[] | null
}

const EMPTY_ENGAGEMENT: StoryEngagement = { storySlug: '', hearts: 0, comments: [] }

function isFresh(story: StorySummary) {
  const published = new Date(story.publishedAt || story.updatedAt).getTime()
  return Number.isFinite(published) && Date.now() - published < 7 * 24 * 60 * 60 * 1000
}

export default function NewsWidget({ stories }: NewsWidgetProps) {
  const [engagement, setEngagement] = useState<Record<string, StoryEngagement>>({})
  const [activeComments, setActiveComments] = useState<string | null>(null)
  const [busyStory, setBusyStory] = useState<string | null>(null)
  const [error, setError] = useState('')

  const feed = stories || []
  const slugs = feed.map((story) => story.slug).join(',')

  useEffect(() => {
    if (!slugs) return
    api
      .getStoryEngagement(slugs.split(','))
      .then((items) => {
        setEngagement((current) => ({
          ...current,
          ...Object.fromEntries(items.map((item) => [item.storySlug, item])),
        }))
      })
      .catch(() => setError('Live reactions are taking a short nap. The stories are still ready to read.'))
  }, [slugs])

  async function addHeart(storySlug: string) {
    setBusyStory(storySlug)
    setError('')
    try {
      const result = await api.heartStory(storySlug)
      setEngagement((current) => ({ ...current, [storySlug]: result }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The heart could not be saved.')
    } finally {
      setBusyStory(null)
    }
  }

  async function addComment(storySlug: string, author: string, message: string) {
    setBusyStory(storySlug)
    setError('')
    try {
      const result = await api.commentOnStory(storySlug, author, message)
      setEngagement((current) => ({ ...current, [storySlug]: result }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The comment could not be saved.')
      throw caught
    } finally {
      setBusyStory(null)
    }
  }

  return (
    <div className="news-widget" aria-label="Latest story news">
      <div className="news-widget__masthead">
        <div>
          <span className="news-widget__eyebrow">The wonder wire</span>
          <h3>News from the story desk</h3>
        </div>
      </div>

      {error && <p className="news-widget__notice">{error}</p>}

      {stories === null && (
        <div className="news-widget__skeleton" aria-label="Loading stories">
          <span />
          <span />
          <span />
        </div>
      )}

      {stories && feed.length === 0 && (
        <div className="news-widget__empty">
          <strong>The wire is quiet.</strong>
          <span>New dispatches appear here as soon as a story is published.</span>
        </div>
      )}

      {feed.map((story, index) => {
        const storyEngagement = engagement[story.slug] || { ...EMPTY_ENGAGEMENT, storySlug: story.slug }
        const commentsOpen = activeComments === story.slug

        return (
          <article className="news-item" key={story.slug}>
            <div className="news-item__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="news-item__content">
              <div className="news-item__meta">
                <time dateTime={story.publishedAt || story.updatedAt}>
                  {formatDate(story.publishedAt || story.updatedAt)}
                </time>
                <span>Story dispatch</span>
              </div>
              <h4 className="news-item__headline">
                {isFresh(story) && (
                  <span className="new-badge">
                    <span className="new-badge__light" aria-hidden="true" />
                    NEW
                  </span>
                )}
                <Link to={`/stories/${story.slug}`}>{story.title}</Link>
              </h4>
              <p>{story.excerpt}</p>

              <div className="news-item__actions">
                <button
                  type="button"
                  className="news-action news-action--heart"
                  onClick={() => addHeart(story.slug)}
                  disabled={busyStory === story.slug}
                  aria-label={`Like ${story.title}`}
                >
                  <span aria-hidden="true">♥</span> {storyEngagement.hearts}
                </button>
                <button
                  type="button"
                  className="news-action"
                  onClick={() => setActiveComments(commentsOpen ? null : story.slug)}
                  aria-expanded={commentsOpen}
                >
                  <span aria-hidden="true">◌</span> {storyEngagement.comments.length} comments
                </button>
                <Link className="news-item__read" to={`/stories/${story.slug}`}>
                  Open story <span aria-hidden="true">↗</span>
                </Link>
              </div>

              {commentsOpen && (
                <CommentPanel
                  storySlug={story.slug}
                  comments={storyEngagement.comments}
                  disabled={busyStory === story.slug}
                  onSubmit={addComment}
                />
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

interface CommentPanelProps {
  storySlug: string
  comments: StoryEngagement['comments']
  disabled: boolean
  onSubmit: (storySlug: string, author: string, message: string) => Promise<void>
}

function CommentPanel({ storySlug, comments, disabled, onSubmit }: CommentPanelProps) {
  const [author, setAuthor] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!author.trim() || !message.trim()) return
    try {
      await onSubmit(storySlug, author, message)
      setMessage('')
    } catch {}
  }

  return (
    <div className="comment-panel">
      <div className="comment-panel__list" aria-live="polite">
        {comments.length === 0 ? (
          <p className="comment-panel__empty">Leave the first note on this dispatch.</p>
        ) : (
          comments.map((comment) => (
            <blockquote key={comment.id}>
              <p>{comment.message}</p>
              <footer>
                {comment.author} · {formatDate(comment.createdAt)}
              </footer>
            </blockquote>
          ))
        )}
      </div>
      <form className="comment-form" onSubmit={submit}>
        <label>
          <span>Name</span>
          <input value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={40} required />
        </label>
        <label className="comment-form__message">
          <span>Comment</span>
          <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={280} required />
        </label>
        <button type="submit" disabled={disabled}>
          Send
        </button>
      </form>
    </div>
  )
}
