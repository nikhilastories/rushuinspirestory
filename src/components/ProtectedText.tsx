import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface ProtectedTextProps {
  className?: string
  children?: ReactNode
  /** Pre-sanitised HTML, for the rendered markdown body of a story. */
  html?: string
}

/**
 * Wraps story prose so it cannot be selected, copied, or right-clicked.
 *
 * The listeners live on this element rather than on `document`, and the
 * `user-select` rule is carried by the `.protected-text` class rather than a
 * global one, so the guard reaches exactly the text it wraps. Nav, footer,
 * buttons, and every form field stay fully selectable and copyable.
 */
export default function ProtectedText({ className, children, html }: ProtectedTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const block = (event: Event) => event.preventDefault()
    const events = ['contextmenu', 'copy', 'cut', 'dragstart'] as const

    for (const name of events) node.addEventListener(name, block)
    return () => {
      for (const name of events) node.removeEventListener(name, block)
    }
  }, [])

  const classes = className ? `protected-text ${className}` : 'protected-text'

  if (html !== undefined) {
    return <div ref={ref} className={classes} dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  )
}
