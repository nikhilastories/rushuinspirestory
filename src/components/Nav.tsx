import { NavLink } from 'react-router-dom'
import { SITE_NAME, SITE_TAGLINE } from '../lib/meta'

function MoonMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
      <path d="M40 14a20 20 0 1 0 10 36 16 16 0 0 1-10-36Z" fill="#E7B563" />
      <circle cx="48" cy="18" r="2.4" fill="#F4D9A0" />
      <circle cx="20" cy="46" r="1.6" fill="#F4D9A0" />
    </svg>
  )
}

export default function Nav() {
  return (
    <header className="site-nav">
      <div className="container site-nav__inner">
        <NavLink to="/" className="brand">
          <span className="brand__mark">
            <MoonMark />
          </span>
          <span>
            <span className="brand__title">{SITE_NAME}</span>
            <br />
            <span className="brand__subtitle">{SITE_TAGLINE}</span>
          </span>
        </NavLink>

        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/stories" className={({ isActive }) => (isActive ? 'active' : '')}>
                Stories
              </NavLink>
            </li>
            <li>
              <NavLink to="/collections" className={({ isActive }) => (isActive ? 'active' : '')}>
                Collections
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
                About
              </NavLink>
            </li>
          </ul>
        </nav>

        <NavLink to="/admin" className="nav-admin-link" title="Storyteller login" aria-label="Storyteller login">
          <MoonMark />
        </NavLink>
      </div>
    </header>
  )
}
