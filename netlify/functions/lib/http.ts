import { GitHubContentError } from './github.js'

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

type Handler<A extends unknown[]> = (...args: A) => Promise<Response>

/**
 * Turn an unexpected throw into a JSON error response.
 *
 * Without this an exception escapes the handler, the function invocation is
 * reported as a crash, and the browser only ever sees a bare 502 with no body —
 * which tells the person using the dashboard nothing about what actually failed.
 */
export function withErrorHandling<A extends unknown[]>(handler: Handler<A>): Handler<A> {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('Unhandled error in function:', error)

      if (error instanceof GitHubContentError) {
        // A genuine upstream failure, so 502 is accurate here — but it now carries a
        // body explaining which side failed. The raw GitHub response is not passed
        // through because it can contain repository details.
        const denied = error.status === 401 || error.status === 403
        return json(
          {
            error: denied
              ? 'GitHub rejected the request. Check that GITHUB_TOKEN is valid and can write to the repository.'
              : 'The storybook could not reach GitHub to save that change. Please try again.',
          },
          502,
        )
      }

      const message = error instanceof Error ? error.message : 'Unknown error'
      return json({ error: `Something went wrong while saving: ${message}` }, 500)
    }
  }
}
