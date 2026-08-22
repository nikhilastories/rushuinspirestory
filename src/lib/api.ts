import type { StoryDetail, StoryStatus, StorySummary } from '../types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    let message = `Something went wrong (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  listPublished: () => request<StorySummary[]>('/api/stories'),
  listAll: () => request<StorySummary[]>('/api/stories?all=1'),
  getStory: (slug: string) => request<StoryDetail>(`/api/stories/${encodeURIComponent(slug)}`),
  createStory: (input: {
    title: string
    excerpt: string
    body: string
    coverImage?: string
    collection?: string
    category?: string[]
  }) =>
    request<StoryDetail>('/api/stories', { method: 'POST', body: JSON.stringify(input) }),
  updateStory: (
    slug: string,
    input: Partial<{
      title: string
      collection: string
      category: string[]
      excerpt: string
      body: string
      coverImage: string
      status: StoryStatus
    }>,
  ) => request<StoryDetail>(`/api/stories/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteStory: (slug: string) => request<void>(`/api/stories/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  uploadImage: (input: { slug: string; filename: string; contentType: string; dataBase64: string }) =>
    request<{ path: string }>('/api/images', { method: 'POST', body: JSON.stringify(input) }),
}
