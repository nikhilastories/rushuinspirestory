const DEFAULT_OWNER = 'nikhilastories'
const DEFAULT_REPO = 'rushuinspirestory'
const DEFAULT_BRANCH = 'main'

function owner() {
  return Netlify.env.get('GITHUB_OWNER') || DEFAULT_OWNER
}

function repo() {
  return Netlify.env.get('GITHUB_REPO') || DEFAULT_REPO
}

function branch() {
  return Netlify.env.get('GITHUB_BRANCH') || DEFAULT_BRANCH
}

function token() {
  return Netlify.env.get('GITHUB_TOKEN')
}

export function isConfigured(): boolean {
  return Boolean(token())
}

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  }
  const t = token()
  if (t) headers.Authorization = `Bearer ${t}`
  return headers
}

export class GitHubContentError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function githubFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${owner()}/${repo()}${path}`, {
    ...init,
    headers: apiHeaders((init?.headers as Record<string, string>) || {}),
  })
  return res
}

export interface DirEntry {
  name: string
  path: string
  type: 'file' | 'dir'
  sha: string
}

/** Shape of a single `contents` entry as returned by the GitHub API. */
interface ContentsResponse extends DirEntry {
  content?: string
}

export async function listDir(path: string): Promise<DirEntry[]> {
  const res = await githubFetch(`/contents/${path}?ref=${branch()}`)
  if (res.status === 404) return []
  if (!res.ok) throw new GitHubContentError(`Could not list ${path}: ${res.status} ${await res.text()}`, res.status)
  const data = (await res.json()) as ContentsResponse | ContentsResponse[]
  return Array.isArray(data) ? data : [data]
}

export async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
  const res = await githubFetch(`/contents/${path}?ref=${branch()}`)
  if (res.status === 404) return null
  if (!res.ok) throw new GitHubContentError(`Could not read ${path}: ${res.status} ${await res.text()}`, res.status)
  const data = (await res.json()) as ContentsResponse | ContentsResponse[]
  if (Array.isArray(data) || !data.content) return null
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { content, sha: data.sha }
}

export async function getRawFile(path: string): Promise<ArrayBuffer | null> {
  const t = token()
  const res = await fetch(`https://raw.githubusercontent.com/${owner()}/${repo()}/${branch()}/${path}`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  })
  if (res.status === 404) return null
  if (!res.ok) throw new GitHubContentError(`Could not fetch raw file ${path}: ${res.status}`, res.status)
  return res.arrayBuffer()
}

export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
  isBase64 = false,
): Promise<{ sha: string }> {
  const body: Record<string, unknown> = {
    message,
    content: isBase64 ? content : Buffer.from(content, 'utf-8').toString('base64'),
    branch: branch(),
  }
  if (sha) body.sha = sha

  const res = await githubFetch(`/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new GitHubContentError(`Could not save ${path}: ${res.status} ${await res.text()}`, res.status)
  const data = (await res.json()) as { content: { sha: string } }
  return { sha: data.content.sha }
}

export async function deleteFile(path: string, sha: string, message: string): Promise<void> {
  const res = await githubFetch(`/contents/${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: branch() }),
  })
  if (!res.ok) throw new GitHubContentError(`Could not delete ${path}: ${res.status} ${await res.text()}`, res.status)
}
