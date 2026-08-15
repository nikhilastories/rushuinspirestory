import { getUser, type User } from '@netlify/identity'
import { githubLogin, isOwner } from './owner.js'

export interface AdminCheck {
  ok: boolean
  response?: Response
}

function unauthorized(message: string, status = 401): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function rolesOf(user: User | null): string[] {
  if (!user) return []
  const fromArray = Array.isArray(user.roles) ? user.roles : []
  return user.role ? [...new Set([...fromArray, user.role])] : fromArray
}

/**
 * Admin either because Identity stamped the role, or because the signed-in
 * account is the configured owner. The second path is what keeps the site
 * usable if the Identity signup event never fired — the account is still a
 * verified Identity session, it is just missing a role it should have been given.
 */
export async function adminSession(): Promise<User | null> {
  const user = await getUser()
  if (!user) return null
  if (rolesOf(user).includes('admin')) return user
  return isOwner(user) ? user : null
}

export async function requireAdmin(): Promise<AdminCheck> {
  const user = await adminSession()
  if (!user) {
    return { ok: false, response: unauthorized('You need to sign in as the storybook owner to do that.') }
  }
  return { ok: true }
}

export async function isAdmin(): Promise<boolean> {
  return Boolean(await adminSession())
}

/** What the admin UI needs to decide whether to show the dashboard. */
export async function sessionSummary() {
  const user = await getUser()
  const admin = Boolean(await adminSession())
  return {
    signedIn: Boolean(user),
    admin,
    email: user?.email,
    login: githubLogin(user ?? {}),
  }
}
