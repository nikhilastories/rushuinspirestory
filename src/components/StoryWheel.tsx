import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories'
import { pickWheelStory, storyWheelSegments, wheelRotation } from '../lib/story-wheel'
import type { StorySummary } from '../types'
import './StoryWheel.css'

interface StoryWheelProps {
  stories: StorySummary[] | null
  error: string
  onRetry: () => void
}

const SEGMENT_COLORS = ['#323235', '#202022', '#3b3b3f', '#252528', '#454549', '#2c2c2f']
const SPIN_DURATION = 4200

export default function StoryWheel({ stories, error, onRetry }: StoryWheelProps) {
  const segments = useMemo(() => storyWheelSegments(stories || [], CATEGORIES), [stories])
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof pickWheelStory>>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spinLock = useRef(false)

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current)
  }, [])

  function spin() {
    if (spinLock.current) return
    const next = pickWheelStory(segments)
    if (!next) return

    setResult(null)
    setRotation((current) => wheelRotation(current, next.index, segments.length))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setResult(next)
      return
    }

    spinLock.current = true
    setIsSpinning(true)
    timer.current = setTimeout(() => {
      setResult(next)
      setIsSpinning(false)
      spinLock.current = false
      timer.current = null
    }, SPIN_DURATION)
  }

  const count = segments.length || 1
  const step = 360 / count

  return (
    <section className="section story-wheel-section" aria-labelledby="story-wheel-heading">
      <div className="container">
        <div className="story-wheel-panel">
          <div className="story-wheel-copy">
            <span className="kicker">Let a little chance lead the way</span>
            <h2 id="story-wheel-heading">Your next story.<br />One spin away.</h2>
            <p>Can&rsquo;t decide? Spin to choose a category at random, then discover a published tale from its shelf.</p>
            <ul className="story-wheel-categories" aria-label="Categories on the wheel">
              {segments.map((segment, index) => (
                <li key={segment.slug} className={`story-wheel-category${result?.index === index ? ' story-wheel-category--selected' : ''}`}>
                  <span className="story-wheel-category__number">{String(index + 1).padStart(2, '0')}</span>
                  {segment.label}
                </li>
              ))}
            </ul>
            <button
              className="btn btn-primary story-wheel-spin"
              type="button"
              disabled={stories === null || segments.length === 0 || isSpinning || Boolean(error)}
              onClick={spin}
            >
              {isSpinning ? 'Finding your next adventure…' : result ? 'Spin again' : 'Spin the wheel'}
              <span aria-hidden="true">↻</span>
            </button>
            <div className="story-wheel-status" role="status" aria-live="polite" aria-atomic="true">
              {stories === null && <p>Gathering the stories for your wheel…</p>}
              {error && <p>{error}</p>}
              {!error && stories !== null && segments.length === 0 && <p>The wheel comes to life when the first story is published.</p>}
              {isSpinning && <p>The wheel is spinning. A little wonder is on its way.</p>}
              {result && (
                <div className="story-wheel-result">
                  <span className="kicker">Your pick · {result.segment.label}</span>
                  <h3>{result.story.title}</h3>
                  <p>{result.story.excerpt}</p>
                  <Link className="text-link" to={`/stories/${result.story.slug}`}>
                    Read this story <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              )}
            </div>
            {error && <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
          </div>
          <div className={`story-wheel-stage${stories === null ? ' story-wheel-stage--loading' : ''}`} aria-hidden="true">
            <div className="story-wheel-pointer" />
            <svg className="story-wheel-disc" viewBox="0 0 400 400" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: isSpinning ? `${SPIN_DURATION}ms` : '0ms' }}>
              {segments.length <= 1 ? <circle cx="200" cy="200" r="194" fill={SEGMENT_COLORS[0]} /> : segments.map((segment, index) => {
                const start = (index * step - 90) * Math.PI / 180
                const end = ((index + 1) * step - 90) * Math.PI / 180
                const path = `M 200 200 L ${200 + 194 * Math.cos(start)} ${200 + 194 * Math.sin(start)} A 194 194 0 ${step > 180 ? 1 : 0} 1 ${200 + 194 * Math.cos(end)} ${200 + 194 * Math.sin(end)} Z`
                return <path key={segment.slug} d={path} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
              })}
              {segments.map((segment, index) => {
                const angle = ((index + 0.5) * step - 90) * Math.PI / 180
                return (
                  <text key={segment.slug} x={200 + 133 * Math.cos(angle)} y={200 + 133 * Math.sin(angle)} textAnchor="middle" dominantBaseline="central">
                    {String(index + 1).padStart(2, '0')}
                  </text>
                )
              })}
              <circle className="story-wheel-rim" cx="200" cy="200" r="194" />
            </svg>
            <div className="story-wheel-hub">
              <svg viewBox="0 0 64 64" fill="none"><path d="M40 14a20 20 0 1 0 10 36 16 16 0 0 1-10-36Z" fill="currentColor" /></svg>
            </div>
            <span className="story-wheel-caption">A turn toward the unexpected.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
