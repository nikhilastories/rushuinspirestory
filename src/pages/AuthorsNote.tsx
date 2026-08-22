import { usePageMeta } from '../lib/meta'

export default function AuthorsNote() {
  usePageMeta(
    'Author’s Note',
    'The story behind the Atlas of Everyday Magic — a note from Nikhila Arkali on where these stories begin.',
  )

  return (
    <section className="authors-note">
      <div className="container">
        <div className="section__head">
          <span className="kicker">The story behind the stories</span>
          <h2>Author&rsquo;s Note: The Spark</h2>
        </div>

        <div className="authors-note__body">
          <p className="authors-note__lede">Every universe begins with a little spark.</p>

          <p>Ours began with a curious little boy named Rushu.</p>

          <p>Rushu is the compass of this entire world.</p>

          <p>
            His endless questions, wild ideas, and wonderful way of seeing ordinary things are where these stories
            begin. A shadow becomes a mystery. A cloud becomes a daydream. An ordinary moment becomes an adventure.
          </p>

          <p>As his mother, I simply follow where his imagination leads.</p>

          <p>
            Atlas of Everyday Magic is our shared map &mdash; a place where little questions become stories, everyday
            moments become adventures, and imagination has no edges.
          </p>

          <p>
            I hope these stories inspire you to pause, wonder, and discover a little magic in your own everyday world.
          </p>

          <p className="authors-note__signature">&mdash; Nikhila Arkali</p>
        </div>
      </div>
    </section>
  )
}
