import { SITE_NAME } from '../lib/meta'

/**
 * Rendered on every route: the full footer on the public site, and a
 * copyright-only strip under the admin studio so the notice is never
 * duplicated per page.
 */
export default function Footer({ variant = 'full' }: { variant?: 'full' | 'minimal' }) {
  const year = new Date().getFullYear()
  const copyright = `© ${year} ${SITE_NAME}. All rights reserved.`

  if (variant === 'minimal') {
    return (
      <footer className="site-footer site-footer--minimal">
        <div className="container">
          <small className="site-footer__legal">{copyright}</small>
        </div>
      </footer>
    )
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__inner">
          <div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{SITE_NAME}</strong>
            <small>Charting wonder from life&rsquo;s little moments.</small>
          </div>
          <a href="/admin">Storyteller login</a>
        </div>
        <small className="site-footer__legal">{copyright}</small>
      </div>
    </footer>
  )
}
