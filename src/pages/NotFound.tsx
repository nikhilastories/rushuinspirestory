import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="story-detail">
      <div className="empty-state">
        <h3>This page wandered off into the story</h3>
        <p>Let&rsquo;s get you back to the shelf.</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 20 }}>
          Back Home
        </Link>
      </div>
    </div>
  )
}
