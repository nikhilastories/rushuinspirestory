import { getUser, handleAuthCallback, MissingIdentityError, oauthLogin, type User } from '@netlify/identity'

export {
  AUTH_EVENTS,
  AuthError,
  getSettings,
  getUser,
  handleAuthCallback,
  logout,
  MissingIdentityError,
  oauthLogin,
  onAuthChange,
  type User,
} from '@netlify/identity'

/** The role that unlocks the admin area. Assigned by `netlify/functions/identity.mts`. */
const ADMIN_ROLE = 'admin'

export function rolesOf(user: User | null): string[] {
  if (!user) return []
  const fromArray = Array.isArray(user.roles) ? user.roles : []
  // `role` is the single account-level value; treat it as a role too so an admin
  // set through the Netlify UI's Role field is honoured either way.
  return user.role ? [...new Set([...fromArray, user.role])] : fromArray
}

export function isAdminUser(user: User | null): boolean {
  return rolesOf(user).includes(ADMIN_ROLE)
}

/** The server's own verdict on this session. */
export interface Session {
  signedIn: boolean
  admin: boolean
  email?: string
  login?: string
}

/**
 * Ask the server whether this session may use the admin area.
 *
 * The token's roles are not the whole story: the site also treats the
 * configured repo owner as admin, so an account that never received the role
 * still gets in. Asking the server means the browser applies exactly the gate
 * the write endpoints apply, instead of a second guess at it.
 */
export async function fetchSession(): Promise<Session | null> {
  try {
    const res = await fetch('/api/session', { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return (await res.json()) as Session
  } catch {
    return null
  }
}

/** True when this session may use the admin area, according to the server. */
export async function checkAdminAccess(): Promise<boolean> {
  const user = await getUser()
  if (isAdminUser(user)) return true
  if (!user) return false
  const session = await fetchSession()
  return Boolean(session?.admin)
}

export async function getAdminUser(): Promise<User | null> {
  const user = await getUser()
  return isAdminUser(user) ? user : null
}

/** The GitHub username Identity recorded for this account, if it recorded one. */
export function githubLoginOf(user: User | null): string | undefined {
  const meta = (user?.userMetadata || {}) as Record<string, unknown>
  const value = meta.user_name ?? meta.preferred_username ?? meta.nickname ?? meta.login
  return typeof value === 'string' && value ? value : undefined
}

export type AuthCallbackOutcome =
  /** No sign-in callback was present in the URL — an ordinary page load. */
  | { kind: 'none' }
  /** Signed in and holds the admin role. */
  | { kind: 'admin'; user: User }
  /** Signed in, but Identity never granted the admin role. */
  | { kind: 'not-admin'; user: User }
  /** The provider or Identity refused the sign-in. */
  | { kind: 'error'; message: string; hint?: string }

/**
 * Netlify Identity reports a refused sign-in by sending the browser back to the
 * site with `#error=...&error_description=...`, and `handleAuthCallback()` only
 * looks for tokens — so without this the message is left sitting in the address
 * bar and the page silently shows the sign-in button again.
 *
 * Snapshotted at module load, before anything else can rewrite the URL.
 */
const initialLocation =
  typeof window === 'undefined'
    ? { hash: '', search: '' }
    : { hash: window.location.hash.replace(/^#/, ''), search: window.location.search.replace(/^\?/, '') }

const CALLBACK_KEYS = [
  'access_token',
  'confirmation_token',
  'recovery_token',
  'invite_token',
  'email_change_token',
  'error',
  'error_description',
]

/** True when the page was opened by a sign-in redirect rather than by the visitor. */
export function hasAuthCallback(): boolean {
  const params = new URLSearchParams(initialLocation.hash || initialLocation.search)
  return CALLBACK_KEYS.some((key) => params.has(key))
}

function readProviderError(): { message: string; hint?: string } | null {
  for (const raw of [initialLocation.hash, initialLocation.search]) {
    if (!raw) continue
    const params = new URLSearchParams(raw)
    const code = params.get('error')
    const description = params.get('error_description')
    if (!code && !description) continue
    return explainAuthFailure(description || code || 'Sign-in was refused.')
  }
  return null
}

/** Strip the callback fragment so a refresh does not replay a spent sign-in. */
function clearCallbackFromUrl() {
  if (typeof window === 'undefined') return
  const query = new URLSearchParams(window.location.search.replace(/^\?/, ''))
  query.delete('error')
  query.delete('error_description')
  const rest = query.toString()
  window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
}

/** Turn a raw GoTrue/provider message into something the storyteller can act on. */
export function explainAuthFailure(message: string): { message: string; hint?: string } {
  const text = message.trim()
  const lower = text.toLowerCase()

  if (lower.includes('signups not allowed') || lower.includes('signup is disabled')) {
    return {
      message: 'Netlify Identity is not accepting new sign-ins for this site.',
      hint: 'In the Netlify dashboard open Project configuration → Identity and set Registration to Open, then try again.',
    }
  }

  if (lower.includes('storybook owner') || lower.includes('not authorized') || lower.includes('unauthorized')) {
    return {
      message: 'That GitHub account is not recognised as the storybook owner.',
      hint: 'Set ADMIN_GITHUB_LOGIN to your GitHub username (or ADMIN_EMAIL to the email on the account) in Project configuration → Environment variables, then sign in again.',
    }
  }

  if (lower.includes('provider') && (lower.includes('not enabled') || lower.includes('missing') || lower.includes('unsupported'))) {
    return {
      message: 'GitHub is not switched on as a login provider for this site.',
      hint: 'Enable GitHub under Project configuration → Identity → Authentication providers.',
    }
  }

  if (lower.includes('access_denied') || lower === 'access denied') {
    return {
      message: 'GitHub sign-in was cancelled before it finished.',
      hint: 'Choose "Continue with GitHub" again and approve the authorisation request.',
    }
  }

  if (lower.includes('identity') && lower.includes('not enabled')) {
    return {
      message: 'Netlify Identity is not enabled on this site yet.',
      hint: 'Enable Identity in the Netlify dashboard, then redeploy the site.',
    }
  }

  return { message: text }
}

let inFlight: Promise<AuthCallbackOutcome> | null = null

/**
 * Start the GitHub redirect.
 *
 * `oauthLogin()` throws on purpose once the redirect is under way, so that throw
 * is swallowed. Anything else is a real problem worth showing — most often
 * Identity not being enabled on the site, which would otherwise make the button
 * look broken.
 */
export function startGithubLogin(): { message: string; hint?: string } | null {
  try {
    oauthLogin('github')
    return null
  } catch (error) {
    if (error instanceof MissingIdentityError) {
      return {
        message: 'Netlify Identity is not available on this site.',
        hint: 'Enable Identity in the Netlify dashboard and redeploy. Running locally, start the site with "netlify dev" so the Identity endpoint exists.',
      }
    }
    const message = error instanceof Error ? error.message : String(error)
    // The library signals "redirect started" by throwing; that is success.
    if (/redirect/i.test(message)) return null
    return explainAuthFailure(message)
  }
}

/**
 * Finish a sign-in redirect. Safe to call from more than one place — the work
 * happens once and every caller sees the same outcome, because the URL fragment
 * can only be spent a single time.
 */
export function consumeAuthCallback(): Promise<AuthCallbackOutcome> {
  if (!inFlight) inFlight = runAuthCallback()
  return inFlight
}

async function runAuthCallback(): Promise<AuthCallbackOutcome> {
  const providerError = readProviderError()
  if (providerError) {
    clearCallbackFromUrl()
    return { kind: 'error', ...providerError }
  }

  let user: User | null = null

  try {
    const result = await handleAuthCallback()
    user = result?.user ?? null
  } catch (error) {
    clearCallbackFromUrl()
    const message = error instanceof Error ? error.message : 'Sign-in failed.'
    return { kind: 'error', ...explainAuthFailure(message) }
  }

  if (!user) user = await getUser()
  if (!user) return { kind: 'none' }

  return (await checkAdminAccess()) ? { kind: 'admin', user } : { kind: 'not-admin', user }
}
