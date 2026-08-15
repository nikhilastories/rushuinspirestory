export default function About() {
  return (
    <section className="about-hero">
      <div className="container">
        <div className="section__head" style={{ marginBottom: 56 }}>
          <span className="kicker">The story behind the stories</span>
          <h2>Meet the muse and the mother</h2>
        </div>

        <div className="about-grid">
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', lineHeight: 1.8, color: 'var(--ink)' }}>
              Rushu asks a hundred questions before breakfast. Why do snails carry their houses? What would happen if
              the moon ran out of light for one night? Could a dragon ever be afraid of the dark?
            </p>
            <p style={{ marginTop: 24, color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.8 }}>
              His mother started writing the answers down &mdash; not the real ones, but the ones his imagination
              already believed. What began as a few notebook pages became this storybook: every tale sparked by
              something Rushu said, dreamed, or wondered out loud.
            </p>
            <p style={{ marginTop: 24, color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.8 }}>
              Each story is handwritten, gently edited, and shared here only once it&rsquo;s truly ready &mdash; from
              first draft, to a careful re-read, to the moment it&rsquo;s finally tucked in among the others.
            </p>
          </div>

          <div>
            <div className="about-card">
              <h3>✦ Written by Mama</h3>
              <p>Every word starts as a bedtime aside, scribbled down before it&rsquo;s forgotten.</p>
            </div>
            <div className="about-card">
              <h3>✦ Inspired by Rushu</h3>
              <p>The questions, the courage, and the occasional chaos are all his.</p>
            </div>
            <div className="about-card">
              <h3>✦ Told in three chapters</h3>
              <p>Draft, review, and published &mdash; every story is lovingly reread before it reaches this page.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
