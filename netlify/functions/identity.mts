// Netlify Identity event functions.
//
// These run server-side whenever someone tries to sign up or log in. They are
// what makes the admin area owner-only: anybody can click "Sign in with GitHub",
// but unless the GitHub account matches the repo owner the attempt is denied.
// The owner has the `admin` role stamped onto their user record, which is what
// `requireAdmin()` checks on every mutating endpoint.
//
// The installed `@netlify/functions` (2.8.2) does not ship types for Identity
// events, so the event shape is described locally. Field names follow the
// camelCase shape the Identity runtime passes to typed handlers.

interface IdentityUser {
  email?: string
  userMetadata?: Record<string, unknown>
  appMetadata?: Record<string, unknown>
}

interface IdentityEvent {
  user: IdentityUser
  deny: (reason?: string) => unknown
}

const DEFAULT_ADMIN_LOGIN = 'nikhilastories'
const DENIAL = 'Only the storybook owner can sign in here.'

/** Pull the GitHub username out of whichever metadata key the provider used. */
function githubLogin(user: IdentityUser): string | undefined {
  const meta = user.userMetadata || {}
  const value = meta.user_name || meta.preferred_username || meta.nickname || meta.login
  return typeof value === 'string' ? value : undefined
}

function adminLogin(): string {
  return (Netlify.env.get('ADMIN_GITHUB_LOGIN') || DEFAULT_ADMIN_LOGIN).toLowerCase()
}

function adminEmail(): string | undefined {
  return Netlify.env.get('ADMIN_EMAIL')?.toLowerCase()
}

function isRepoOwner(user: IdentityUser): boolean {
  const login = githubLogin(user)?.toLowerCase()
  if (login && login === adminLogin()) return true

  const email = adminEmail()
  return Boolean(email && user.email?.toLowerCase() === email)
}

function roles(user: IdentityUser): string[] {
  const value = (user.appMetadata || {}).roles
  return Array.isArray(value) ? (value as string[]) : []
}

/** The user record with `admin` added to its existing roles. */
function withAdminRole(user: IdentityUser) {
  return {
    user: {
      ...user,
      appMetadata: {
        ...(user.appMetadata || {}),
        roles: [...new Set([...roles(user), 'admin'])],
      },
    },
  }
}

export default {
  /** Reject non-owners before an account is ever created. */
  userValidate(event: IdentityEvent) {
    if (!isRepoOwner(event.user)) return event.deny(DENIAL)
  },

  /** The owner completes signup and becomes the admin. */
  userSignup(event: IdentityEvent) {
    if (!isRepoOwner(event.user)) return event.deny(DENIAL)
    return withAdminRole(event.user)
  },

  /** Belt-and-braces: block logins that lack the admin role. */
  userLogin(event: IdentityEvent) {
    if (roles(event.user).includes('admin')) return
    if (isRepoOwner(event.user)) return withAdminRole(event.user)
    return event.deny(DENIAL)
  },
}
