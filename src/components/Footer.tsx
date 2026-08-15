export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Rushu&rsquo;s Storybook</strong>
          <small>Handwritten with love, one bedtime at a time.</small>
        </div>
        <a href="/admin">Storyteller login</a>
      </div>
    </footer>
  )
}
