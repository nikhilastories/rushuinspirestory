/** Shared mutable state for the endpoint test fixtures. */

export const repo = new Map<string, string>()
export const commits: string[] = []

/** Set to make the next putFile call fail, simulating an upstream GitHub error. */
export const failure: { next: Error | null } = { next: null }

export function reset() {
  repo.clear()
  commits.length = 0
  failure.next = null
}
