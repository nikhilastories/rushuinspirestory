import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminTopbar from './AdminTopbar'
import StatusPill from '../../components/StatusPill'
import { api } from '../../lib/api'
import { renderMarkdown } from '../../lib/markdown'
import { slugify } from '../../lib/slug'
import { usePageMeta } from '../../lib/meta'
import { CATEGORIES, toCategorySlugs } from '../../lib/categories'
import type { StoryDetail } from '../../types'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function StoryEditor() {
  const { slug } = useParams()
  const isNew = !slug
  const navigate = useNavigate()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [collection, setCollection] = useState('')
  const [knownCollections, setKnownCollections] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [status, setStatus] = useState<string>('draft')
  const [currentSlug, setCurrentSlug] = useState(slug || '')

  usePageMeta(isNew ? 'New story' : `Editing ${title || 'story'}`)

  useEffect(() => {
    api
      .listAll()
      .then((all) => {
        const names = [...new Set(all.map((s) => s.collection?.trim()).filter((n): n is string => Boolean(n)))]
        setKnownCollections(names.sort((a, b) => a.localeCompare(b)))
      })
      .catch(() => setKnownCollections([]))
  }, [])

  useEffect(() => {
    if (isNew) return
    api
      .getStory(slug!)
      .then((story: StoryDetail) => {
        setTitle(story.title)
        setExcerpt(story.excerpt)
        setCollection(story.collection || '')
        setCategories(toCategorySlugs(story.category))
        setBody(story.body)
        setCoverImage(story.coverImage || '')
        setStatus(story.status)
        setCurrentSlug(story.slug)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, isNew])

  async function handleCoverUpload(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      setError('That image is too large. Please choose one under 4MB.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const dataBase64 = await fileToBase64(file)
      const targetSlug = currentSlug || slugify(title) || 'untitled'
      const result = await api.uploadImage({
        slug: targetSlug,
        filename: file.name,
        contentType: file.type || 'image/jpeg',
        dataBase64,
      })
      setCoverImage(result.path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that image.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Give the story a title first.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (isNew) {
        const created = await api.createStory({
          title,
          excerpt,
          body,
          collection,
          category: categories,
          coverImage: coverImage || undefined,
        })
        navigate(`/admin/stories/${created.slug}/edit`, { replace: true })
        setNotice('Draft saved.')
      } else {
        const updated = await api.updateStory(currentSlug, {
          title,
          excerpt,
          body,
          collection,
          category: categories,
          coverImage,
        })
        setStatus(updated.status)
        setNotice('Saved.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the story.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <AdminTopbar title="Loading story…" />
        <div className="container admin-body">
          <div className="center-loader">
            <div className="spinner" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <AdminTopbar title={isNew ? 'New Story' : 'Edit Story'} />
      <div className="container admin-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          {!isNew && <StatusPill status={status} />}
          {notice && <span style={{ color: '#4c6b41', fontWeight: 600, fontSize: '0.9rem' }}>{notice}</span>}
        </div>

        {error && <div className="banner banner--error">{error}</div>}

        <div className="editor-grid">
          <div>
            <div className="field">
              <label>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Night the Moon Went Missing" />
            </div>

            <div className="field">
              <label>Excerpt</label>
              <textarea
                style={{ minHeight: 90, fontFamily: 'var(--font-body)' }}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A one or two sentence teaser shown on the story cards…"
              />
            </div>

            <div className="field">
              <label>Collection</label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Bedtime Voyages"
                list="collection-suggestions"
              />
              <datalist id="collection-suggestions">
                {knownCollections.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="field-hint">
                Optional. Stories sharing a collection appear together on the Collections page; leave it blank and the
                story is shelved by the year it was published.
              </div>
            </div>

            <div className="field">
              <label>Categories</label>
              <div className="category-picker">
                {CATEGORIES.map((category) => {
                  const checked = categories.includes(category.slug)
                  return (
                    <label key={category.slug} className="category-picker__option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setCategories((current) =>
                            e.target.checked
                              ? [...current, category.slug]
                              : current.filter((slug) => slug !== category.slug),
                          )
                        }
                      />
                      {category.label}
                    </label>
                  )
                })}
              </div>
              <div className="field-hint">
                Pick one or more. The list comes from <code>categories.json</code> &mdash; add an entry there to offer a
                new category here and on the Stories page.
              </div>
            </div>

            <div className="field">
              <label>Cover image</label>
              <div className="cover-drop">
                {coverImage ? <img src={coverImage} alt="Cover" /> : <div style={{ width: 84, height: 84, borderRadius: 10, background: 'var(--bg-soft)' }} />}
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                    disabled={uploading}
                  />
                  {uploading && <div className="field-hint">Uploading…</div>}
                </div>
              </div>
            </div>

            <div className="field">
              <label>Story (Markdown)</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Once upon a bedtime…" />
              <div className="field-hint">Formatted with Markdown &mdash; headings, *italics*, **bold**, and images all work.</div>
            </div>

            <div className="editor-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Save Draft' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="editor-preview">
            <div className="editor-preview__label">Live Preview</div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>{title || 'Untitled story'}</h2>
            {coverImage && <img src={coverImage} alt="" style={{ borderRadius: 12, marginBottom: 20 }} />}
            <div className="story-content" style={{ fontSize: '1.02rem' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
          </div>
        </div>
      </div>
    </div>
  )
}
