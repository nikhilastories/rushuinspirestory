// Netlify Identity event functions.
//
// These run server-side whenever someone tries to sign up or log in. They are
// what makes the admin area owner-only: anybody can click "Sign in with GitHub",
// but only the repo owner comes back with the `admin` role stamped onto their
// user record.
//
// Denials here are what the browser sees as `#error=...` in the address bar, so
// the rules in `lib/owner.ts` are deliberately careful to deny only accounts we
// can positively identify as somebody else. `requireAdmin()` applies the same
// rule on every request, so admin access does not depend on these events having
// fired successfully.
//
// The installed `@netlify/functions` (2.8.2) does not ship types for Identity
// events, so the event shape is described locally. Field names follow the
// camelCase shape the Identity runtime passes to typed handlers.

import { verdictFor } from './lib/owner.js'

interface IdentityUser {
  email?: string
  userMetadata?: Record<string, unknown>
  appMetadata?: Record<string, unknown>
}

interface IdentityEvent {
  user: IdentityUser
  deny: (reason?: string) => unknown
}

const DENIAL = 'That GitHub account is not the storybook owner.'

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
  /** Reject accounts we can positively identify as somebody else. */
  userValidate(event: IdentityEvent) {
    if (verdictFor(event.user) === 'stranger') return event.deny(DENIAL)
  },

  /** The owner completes signup and becomes the admin. */
  userSignup(event: IdentityEvent) {
    const verdict = verdictFor(event.user)
    if (verdict === 'stranger') return event.deny(DENIAL)
    if (verdict === 'owner') return withAdminRole(event.user)
    // Unidentifiable: create the account, but grant nothing.
  },

  /**
   * Re-check on every login, so correcting ADMIN_GITHUB_LOGIN or ADMIN_EMAIL
   * grants the role on the next sign-in without touching the Identity user list.
   */
  userLogin(event: IdentityEvent) {
    if (roles(event.user).includes('admin')) return
    const verdict = verdictFor(event.user)
    if (verdict === 'owner') return withAdminRole(event.user)
    if (verdict === 'stranger') return event.deny(DENIAL)
  },
}
