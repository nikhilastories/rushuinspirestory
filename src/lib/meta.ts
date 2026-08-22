import { useEffect } from 'react'

/** The wordmark. Single source of truth for every title, footer, and nav brand. */
export const SITE_NAME = 'Atlas of Everyday Magic'
export const SITE_TAGLINE = 'Charting wonder from life’s little moments'
export const SITE_DESCRIPTION =
  'Atlas of Everyday Magic — charting wonder from life’s little moments. Handwritten stories where tiny ideas grow wings and ordinary moments open doors to extraordinary adventures.'

/** Where link previews resolve their absolute image and page URLs. */
export const SITE_URL = 'https://son-spark-mothers-magic.netlify.app'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * This is a single-page app with one static <head>, so each route sets its own
 * title and description as it mounts. Pass a page label to get
 * "Label — Atlas of Everyday Magic"; omit it for the branded home title.
 *
 * The Open Graph and Twitter tags in index.html are what crawlers actually read,
 * since they do not run the app; these updates keep the live head consistent for
 * anything that does execute JavaScript.
 */
export function usePageMeta(pageTitle?: string, description: string = SITE_DESCRIPTION) {
  useEffect(() => {
    const title = pageTitle ? `${pageTitle} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`

    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${SITE_URL}${window.location.pathname}`)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  }, [pageTitle, description])
}
