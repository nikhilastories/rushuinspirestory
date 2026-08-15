import { getUser } from '@netlify/identity'

export {
  AUTH_EVENTS,
  getSettings,
  getUser,
  handleAuthCallback,
  logout,
  oauthLogin,
  onAuthChange,
} from '@netlify/identity'

export async function getAdminUser() {
  const user = await getUser()
  const roles = (user as unknown as { appMetadata?: { roles?: string[] } } | null)?.appMetadata?.roles
  if (user && roles?.includes('admin')) return user
  return null
}
