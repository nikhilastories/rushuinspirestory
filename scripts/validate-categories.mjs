import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

const CATEGORIES_FILE = 'categories.json'
const STORIES_DIR = join('content', 'stories')

function readCategories(root) {
  const raw = JSON.parse(readFileSync(join(root, CATEGORIES_FILE), 'utf8'))
  if (!Array.isArray(raw)) {
    throw new Error(`${CATEGORIES_FILE} must be a JSON array of { "slug", "label" } objects.`)
  }

  const slugs = new Set()
  raw.forEach((entry, i) => {
    if (!entry || typeof entry.slug !== 'string' || typeof entry.label !== 'string') {
      throw new Error(`${CATEGORIES_FILE}[${i}] must be an object with string "slug" and "label" fields.`)
    }
    if (slugs.has(entry.slug)) throw new Error(`${CATEGORIES_FILE} lists the slug "${entry.slug}" more than once.`)
    slugs.add(entry.slug)
  })

  return slugs
}

function storyFiles(root) {
  try {
    return readdirSync(join(root, STORIES_DIR)).filter((name) => name.endsWith('.md'))
  } catch {
    return []
  }
}

/**
 * Every story's `category` must name an entry in categories.json. Unknown slugs are a
 * build failure so a typo cannot ship as a story that quietly disappears from its shelf;
 * a story with no category at all is only a warning, since the field stays optional.
 */
export function validateStoryCategories({ root = process.cwd(), strict = true } = {}) {
  const valid = readCategories(root)
  const errors = []
  const warnings = []

  for (const file of storyFiles(root)) {
    const path = join(STORIES_DIR, file)
    const { data } = matter(readFileSync(join(root, path), 'utf8'))
    const raw = data.category

    if (raw === undefined || raw === null || (Array.isArray(raw) && raw.length === 0) || raw === '') {
      warnings.push(`${path}: no "category" in frontmatter — it will show as uncategorised.`)
      continue
    }

    const slugs = Array.isArray(raw) ? raw : [raw]
    for (const slug of slugs) {
      if (typeof slug !== 'string') {
        errors.push(`${path}: "category" must be a string or an array of strings.`)
      } else if (!valid.has(slug)) {
        errors.push(
          `${path}: category "${slug}" is not listed in ${CATEGORIES_FILE}. ` +
            `Add it there, or use one of: ${[...valid].join(', ')}.`,
        )
      }
    }
  }

  for (const warning of warnings) console.warn(`[categories] warning — ${warning}`)

  if (errors.length) {
    const message = [`Invalid story categories (${errors.length}):`, ...errors.map((e) => `  - ${e}`)].join('\n')
    if (strict) throw new Error(message)
    console.warn(`[categories] ${message}`)
  }

  return { errors, warnings }
}

/** Vite plugin so `vite build` validates content before it emits anything. */
export function validateCategoriesPlugin(options = {}) {
  return {
    name: 'validate-story-categories',
    apply: 'build',
    buildStart() {
      validateStoryCategories(options)
    },
  }
}

// Also runnable on its own: `node scripts/validate-categories.mjs`
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const { errors } = validateStoryCategories()
    if (!errors.length) console.log('[categories] all story categories are valid.')
  } catch (error) {
    console.error(`[categories] ${error.message}`)
    process.exit(1)
  }
}
