import type { Config } from '@netlify/functions'
import { sessionSummary } from './lib/auth.js'

/**
 * The server's own verdict on the current session.
 *
 * The admin pages ask this rather than reading roles out of the token, so the
 * gate the browser applies is the same one the write endpoints apply. Nothing
 * here is a secret: it describes the caller to themselves.
 */
export default async () => {
  const summary = await sessionSummary()
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const config: Config = {
  path: '/api/session',
}
