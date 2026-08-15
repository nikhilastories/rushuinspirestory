/** Stand-in for netlify/functions/lib/auth.ts — always the signed-in owner. */

export async function requireAdmin() {
  return { ok: true }
}

export async function isAdmin() {
  return true
}

export async function adminSession() {
  return { email: 'owner@example.com' }
}

export async function sessionSummary() {
  return { signedIn: true, admin: true, email: 'owner@example.com', login: 'owner' }
}
