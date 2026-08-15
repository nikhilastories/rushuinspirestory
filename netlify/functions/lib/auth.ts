import { getUser } from '@netlify/identity'

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

export async function requireAdmin(): Promise<AdminCheck> {
  const user = await getUser()
  const roles = (user as unknown as { appMetadata?: { roles?: string[] } } | null)?.appMetadata?.roles
  if (!user || !roles?.includes('admin')) {
    return { ok: false, response: unauthorized('You need to sign in as the storybook owner to do that.') }
  }
  return { ok: true }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  const roles = (user as unknown as { appMetadata?: { roles?: string[] } } | null)?.appMetadata?.roles
  return Boolean(user && roles?.includes('admin'))
}
