// Who owns the storybook.
//
// The same rule is applied in two places: `identity.mts` uses it to stamp the
// `admin` role at signup, and `auth.ts` uses it on every request. Applying it at
// request time as well means a missed Identity event — a webhook that never
// fired, a user list that was cleared — cannot lock the owner out of their own
// site, because ownership is re-derived from the signed-in identity each time.

const DEFAULT_ADMIN_LOGIN = 'nikhilastories'

/**
 * Metadata keys that have held the GitHub username across GoTrue versions.
 * Reading only one of them is how a legitimate owner ends up refused.
 */
const LOGIN_KEYS = ['user_name', 'preferred_username', 'nickname', 'login', 'username', 'slug', 'provider_id']

/** The subset of an Identity user both callers can supply. */
export interface OwnerCandidate {
  email?: string
  userMetadata?: Record<string, unknown>
}

export type Verdict = 'owner' | 'stranger' | 'unknown'

function env(name: string): string | undefined {
  const value = Netlify.env.get(name)
  return value ? value.trim() : undefined
}

function list(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

/** The GitHub username, from whichever metadata key the provider happened to use. */
export function githubLogin(user: OwnerCandidate): string | undefined {
  const meta = user.userMetadata || {}
  for (const key of LOGIN_KEYS) {
    const value = meta[key]
    if (typeof value === 'string' && value.trim()) return value.trim().toLowerCase()
  }
  return undefined
}

/** `https://github.com/owner/repo` → `owner`. */
function ownerFromRepositoryUrl(): string | undefined {
  const match = env('REPOSITORY_URL')?.match(/github\.com[/:]([^/]+)\//)
  return match?.[1]
}

/** Every GitHub username allowed to own the storybook, lowercased. */
export function adminLogins(): string[] {
  const configured = list(env('ADMIN_GITHUB_LOGIN'))
  if (configured.length > 0) return configured

  const fallbacks = [env('GITHUB_OWNER'), ownerFromRepositoryUrl(), DEFAULT_ADMIN_LOGIN]
  return [...new Set(fallbacks.filter(Boolean).map((value) => (value as string).toLowerCase()))]
}

/** Every email address allowed to own the storybook, lowercased. */
export function adminEmails(): string[] {
  return list(env('ADMIN_EMAIL'))
}

/**
 * Decide who is knocking.
 *
 * `unknown` matters: if Identity hands us an account with no readable username
 * and no configured email to compare against, refusing it would lock the real
 * owner out with nothing but a URL fragment to explain why. Such an account is
 * allowed to exist without privileges instead, so the login page can say what
 * happened and the next sign-in can be fixed with an environment variable.
 */
export function verdictFor(user: OwnerCandidate): Verdict {
  const email = user.email?.trim().toLowerCase()
  const emails = adminEmails()
  if (email && emails.includes(email)) return 'owner'

  const login = githubLogin(user)
  if (login) return adminLogins().includes(login) ? 'owner' : 'stranger'

  // No username to go on. Only call it a stranger when an email allow-list was
  // configured and this account's address is not on it.
  if (emails.length > 0 && email) return 'stranger'
  return 'unknown'
}

export function isOwner(user: OwnerCandidate | null | undefined): boolean {
  return Boolean(user) && verdictFor(user as OwnerCandidate) === 'owner'
}
