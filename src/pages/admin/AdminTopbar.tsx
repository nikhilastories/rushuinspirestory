import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../lib/identity'

export default function AdminTopbar({ title }: { title: string }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin', { replace: true })
  }

  return (
    <div className="admin-topbar">
      <div className="container admin-topbar__inner">
        <div>
          <span className="kicker">Storyteller Studio</span>
          <h2 style={{ fontSize: '1.4rem', marginTop: 4 }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/" className="btn btn-ghost">
            View site
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
