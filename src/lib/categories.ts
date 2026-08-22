import categoriesJson from '../../categories.json'

export interface Category {
  slug: string
  label: string
}

/**
 * The single source of truth for categories is `categories.json` at the repo
 * root. Nothing in the UI hardcodes a category: adding one there is the whole
 * change, and every chip, filter, and card label picks it up from here.
 */
export const CATEGORIES: Category[] = categoriesJson as Category[]

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]))

/** Frontmatter accepts a single slug or a list, so both shapes normalise to a list. */
export function toCategorySlugs(value: string | string[] | undefined | null): string[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value : [value]
  const seen = new Set<string>()
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const slug = entry.trim()
    if (slug) seen.add(slug)
  }
  return [...seen]
}

export function categoryBySlug(slug: string): Category | undefined {
  return BY_SLUG.get(slug)
}

/** Unknown slugs still render, so a typo shows up on the page instead of vanishing. */
export function categoryLabel(slug: string): string {
  return BY_SLUG.get(slug)?.label ?? slug
}

/** Categories a story belongs to, in the order `categories.json` declares them. */
export function categoriesFor(value: string | string[] | undefined | null): Category[] {
  const slugs = new Set(toCategorySlugs(value))
  const known = CATEGORIES.filter((c) => slugs.has(c.slug))
  const unknown = [...slugs].filter((s) => !BY_SLUG.has(s)).map((slug) => ({ slug, label: slug }))
  return [...known, ...unknown]
}
