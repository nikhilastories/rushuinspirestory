import type { Config } from '@netlify/functions'
import { getRawFile, isConfigured } from './lib/github.js'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export default async (req: Request) => {
  if (!isConfigured()) {
    return new Response('Not found', { status: 404 })
  }

  const pathname = new URL(req.url).pathname
  const relativePath = decodeURIComponent(pathname.replace(/^\/api\/images\//, ''))

  if (!relativePath || relativePath.includes('..')) {
    return new Response('Not found', { status: 404 })
  }

  const ext = relativePath.split('.').pop()?.toLowerCase() || ''
  const contentType = CONTENT_TYPES[ext]
  if (!contentType) {
    return new Response('Not found', { status: 404 })
  }

  const buffer = await getRawFile(`content/stories/images/${relativePath}`)
  if (!buffer) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  })
}

export const config: Config = {
  path: '/api/images/*',
}
