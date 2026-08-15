import type { Config } from '@netlify/functions'
import { isConfigured, putFile } from './lib/github.js'
import { requireAdmin } from './lib/auth.js'

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])
const MAX_BYTES = 4 * 1024 * 1024

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function sanitizeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled'
  )
}

function sanitizeFilename(value: string): string | null {
  const ext = value.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return null
  const base = value
    .slice(0, value.length - ext.length - 1)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${base || 'image'}-${Date.now()}.${ext}`
}

/** Untrusted upload payload — every field is validated below. */
interface UploadBody {
  slug?: unknown
  filename?: unknown
  dataBase64?: unknown
}

export default async (req: Request) => {
  if (!isConfigured()) {
    return json({ error: 'The storybook is not connected to GitHub yet.' }, 503)
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const admin = await requireAdmin()
  if (!admin.ok) return admin.response!

  const body = (await req.json().catch(() => null)) as UploadBody | null
  if (!body || typeof body.slug !== 'string' || typeof body.filename !== 'string' || typeof body.dataBase64 !== 'string') {
    return json({ error: 'Missing image data.' }, 400)
  }
  const { dataBase64 } = body

  const filename = sanitizeFilename(body.filename)
  if (!filename) {
    return json({ error: 'Only PNG, JPG, GIF, WEBP, or SVG images are supported.' }, 400)
  }

  const approxBytes = (dataBase64.length * 3) / 4
  if (approxBytes > MAX_BYTES) {
    return json({ error: 'That image is too large. Please choose one under 4MB.' }, 413)
  }

  const slug = sanitizeSlug(body.slug)
  const path = `content/stories/images/${slug}/${filename}`

  await putFile(path, dataBase64, `Add image for ${slug}: ${filename}`, undefined, true)

  return json({ path: `/api/images/${slug}/${filename}` }, 201)
}

export const config: Config = {
  path: '/api/images',
}
