# Atlas of Everyday Magic

Charting wonder from life's little moments. A cozy home for stories a mother writes with her son as the inspiration.

Stories live in this repository as Markdown files, so every draft, revision, and publication is an ordinary
git commit. The site reads them back through the GitHub API and shows the published ones to visitors.

## How it works

- **Public site** — Vite + React + TypeScript single-page app (`src/`). Home, Stories, Collections,
  individual story pages, and an Author's Note page.
- **API** — Netlify Functions (`netlify/functions/`) that read and write story files through the GitHub
  Contents API.
- **Content** — `content/stories/*.md`, one file per story, with YAML frontmatter. Images uploaded from the
  admin area land in `content/stories/images/<slug>/`.
- **Admin** — `/admin`, reachable only by the repo owner signing in with GitHub through Netlify Identity.

## Editorial workflow

Each story file carries a `status` in its frontmatter and moves through three phases:

| Phase | Meaning | Visible publicly |
|---|---|---|
| `draft` | Being written | No |
| `review` | Finished, awaiting a final read | No |
| `published` | Live on the site | Yes |

Every transition writes a commit with a message like `Move "The Ceiling Fan to the Moon" from review to
published`, so the editorial history is readable straight from `git log`.

A story file looks like this:

```markdown
---
title: "The Ceiling Fan to the Moon"
slug: the-ceiling-fan-to-the-moon
status: published
collection: "Bedtime Voyages"
category:
  - bedtime-voyages
  - curious-questions
excerpt: "How one bedtime question turned into a whole shelf of stories."
coverImage: /api/images/the-ceiling-fan-to-the-moon/cover-1234567890.jpg
createdAt: "2026-08-15T00:00:00.000Z"
updatedAt: "2026-08-15T00:00:00.000Z"
publishedAt: "2026-08-15T00:00:00.000Z"
---

Every storybook has to start somewhere…
```

Stories can be written either in the admin editor or by committing a Markdown file directly — both produce
the same result.

## Collections

`collection` is the only optional-by-choice field. Give two stories the same collection name and they appear
together as a shelf on `/collections`; leave it blank and the story is shelved under the year it was
published, so every story lands somewhere without any bookkeeping. The admin editor suggests collection names
already in use, and hand-edited names in a Markdown file are preserved exactly as written.

## Categories

`categories.json` at the repo root is the single source of truth for the categories a story may belong to:

```json
[{ "slug": "bedtime-voyages", "label": "Bedtime Voyages" }]
```

A story names one or more of those slugs in its `category` frontmatter — a bare string for one, a YAML list for
several. `/stories` reads the same file to build its filter chips and its grouped sections, and each story card
shows its category labels. **Adding a category is a one-line edit to `categories.json`**; no component takes a
hardcoded list, and the admin editor's checkboxes are generated from it too.

`vite build` validates the content before it emits anything (`scripts/validate-categories.mjs`, wired in as a
Vite plugin). A story naming a category that `categories.json` does not list **fails the build** with the
offending file, slug, and the list of valid slugs. A story with no category at all only logs a warning, since the
field stays optional. Run it on its own with `npm run validate:categories`.

## Reading protection

Story prose is guarded against casual copying: `src/components/ProtectedText.tsx` applies `user-select: none` and
cancels the `contextmenu`, `copy`, `cut`, and `dragstart` events. Both the CSS and the listeners are scoped to
that one wrapper — nothing is attached to `document` — so it covers story text on `/stories`, `/collections`, and
the story pages, while nav, footer, buttons, and every form field stay fully selectable. Home page previews are
deliberately left unguarded.

## Setup

Three things need configuring in the Netlify dashboard before the admin area works.

### 1. GitHub token

Create a fine-grained personal access token with **Contents: read and write** permission on this repository,
then add it as a site environment variable named `GITHUB_TOKEN`. Without it the site still builds and serves,
but the API returns a clear "not connected to GitHub yet" message instead of story data.

Optional overrides, only needed if the content should live somewhere other than this repo's `main` branch:
`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`.

### 2. Netlify Identity with GitHub

Enable Identity for the site, then under **Identity → Authentication providers** enable **GitHub**. Registration
must be set to **Open** — with "Invite only", GitHub sign-in is refused before it reaches this site's rules.

Who counts as the owner is decided by `netlify/functions/lib/owner.ts`. It works out the owner's GitHub username
on its own, preferring `ADMIN_GITHUB_LOGIN`, then `GITHUB_OWNER`, then the account in the site's repository URL,
and finally the built-in default `nikhilastories`. Set `ADMIN_EMAIL` to also accept a specific email address.
Both variables accept a comma-separated list.

An account that clearly belongs to somebody else is denied before it is ever created. An account whose GitHub
username Identity did not record is allowed to exist but is granted nothing, and the login page explains which
variable to set. Roles are re-checked on every login, so correcting a variable grants access on the next sign-in
without editing the Identity user list by hand.

That same rule is applied again on every request in `netlify/functions/lib/auth.ts`, so the signed-in owner is
admitted whether or not the `admin` role was ever stamped on their record. A missed Identity event cannot lock
the owner out of their own site.

### 3. First admin

The owner's first sign-in through GitHub assigns the `admin` role automatically, and is admitted even if that
assignment does not happen. If the role ever needs to be set by hand — for example after clearing the Identity
user list — invite the address from **Identity → Invite users**, then open the user and add `admin` to their
**Roles** field.

### Sign-in troubleshooting

Netlify Identity reports a refused sign-in by sending the browser back with `#error=…` in the address bar. The
`/admin` page reads that fragment, explains what went wrong in plain language, and clears it from the URL, so the
reason for a failed sign-in is on the page rather than in the address bar.

`GET /api/session` reports what the server makes of the current session — whether it is signed in, whether it
counts as admin, and the email and GitHub username it matched against. When the login page says an account is not
recognised, it names the value to configure by reading it from there.

## Local development

```bash
npm install
npm run dev        # Vite dev server (public pages only)
netlify dev        # full stack, including the functions and Identity
```

The admin area and story API need `netlify dev`, since they depend on Netlify Functions and Identity.
