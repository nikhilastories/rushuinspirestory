# rushuinspirestory

**A Son's Spark, a Mother's Magic** — a cozy home for stories a mother writes with her son as the inspiration.

Stories live in this repository as Markdown files, so every draft, revision, and publication is an ordinary
git commit. The site reads them back through the GitHub API and shows the published ones to visitors.

## How it works

- **Public site** — Vite + React + TypeScript single-page app (`src/`). Home, Stories, individual story
  pages, and an About page.
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
title: "Welcome to Rushu's Storybook"
slug: welcome-to-rushus-storybook
status: published
excerpt: "How one boy's bedtime questions turned into a whole shelf of stories."
coverImage: /api/images/welcome-to-rushus-storybook/cover-1234567890.jpg
createdAt: "2026-08-15T00:00:00.000Z"
updatedAt: "2026-08-15T00:00:00.000Z"
publishedAt: "2026-08-15T00:00:00.000Z"
---

Every storybook has to start somewhere…
```

Stories can be written either in the admin editor or by committing a Markdown file directly — both produce
the same result.

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
