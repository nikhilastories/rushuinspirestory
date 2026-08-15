import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminTopbar from './AdminTopbar'
import StatusPill from '../../components/StatusPill'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { StoryStatus, StorySummary } from '../../types'

const TABS: { key: 'all' | StoryStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'In Review' },
  { key: 'published', label: 'Published' },
]

export default function AdminDashboard() {
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [tab, setTab] = useState<'all' | StoryStatus>('all')
  const [error, setError] = useState('')
  const [busySlug, setBusySlug] = useState<string | null>(null)

  function load() {
    api
      .listAll()
      .then((data) => setStories(data))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function changeStatus(slug: string, status: StoryStatus) {
    setBusySlug(slug)
    setError('')
    try {
      await api.updateStory(slug, { status })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the story.')
    } finally {
      setBusySlug(null)
    }
  }

  async function remove(slug: string) {
    if (!confirm('Delete this story for good? This cannot be undone.')) return
    setBusySlug(slug)
    setError('')
    try {
      await api.deleteStory(slug)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the story.')
    } finally {
      setBusySlug(null)
    }
  }

  const filtered = stories?.filter((s) => tab === 'all' || s.status === tab) ?? []

  return (
    <div className="admin-shell">
      <AdminTopbar title="Manage Stories" />
      <div className="container admin-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div className="tab-row" style={{ marginBottom: 0 }}>
            {TABS.map((t) => (
              <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
                {stories && t.key !== 'all' && ` (${stories.filter((s) => s.status === t.key).length})`}
              </button>
            ))}
          </div>
          <Link to="/admin/stories/new" className="btn btn-gold btn-sm">
            + New Story
          </Link>
        </div>

        {error && <div className="banner banner--error">{error}</div>}

        {stories === null && !error && (
          <div className="center-loader">
            <div className="spinner" />
          </div>
        )}

        {stories && filtered.length === 0 && (
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>Start a new story to see it appear in this list.</p>
          </div>
        )}

        {filtered.map((story) => (
          <div className="admin-story-row" key={story.slug}>
            {story.coverImage ? (
              <img className="admin-story-row__thumb" src={story.coverImage} alt="" />
            ) : (
              <div className="admin-story-row__thumb" />
            )}
            <div className="admin-story-row__main">
              <div className="admin-story-row__title">{story.title}</div>
              <div className="admin-story-row__meta">
                <StatusPill status={story.status} />
                <span>Updated {formatDate(story.updatedAt)}</span>
              </div>
            </div>
            <div className="admin-story-row__actions">
              {story.status === 'draft' && (
                <button className="btn btn-secondary btn-sm" disabled={busySlug === story.slug} onClick={() => changeStatus(story.slug, 'review')}>
                  Send to Review
                </button>
              )}
              {story.status === 'review' && (
                <>
                  <button className="btn btn-secondary btn-sm" disabled={busySlug === story.slug} onClick={() => changeStatus(story.slug, 'draft')}>
                    Back to Draft
                  </button>
                  <button className="btn btn-gold btn-sm" disabled={busySlug === story.slug} onClick={() => changeStatus(story.slug, 'published')}>
                    Publish
                  </button>
                </>
              )}
              {story.status === 'published' && (
                <button className="btn btn-secondary btn-sm" disabled={busySlug === story.slug} onClick={() => changeStatus(story.slug, 'review')}>
                  Unpublish
                </button>
              )}
              <Link to={`/admin/stories/${story.slug}/edit`} className="btn btn-secondary btn-sm">
                Edit
              </Link>
              <button className="btn btn-danger btn-sm" disabled={busySlug === story.slug} onClick={() => remove(story.slug)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
