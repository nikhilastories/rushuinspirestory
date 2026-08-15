/** In-memory stand-in for netlify/functions/lib/github.ts. */
import { commits, failure, repo } from './state.ts'

export class GitHubContentError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function isConfigured(): boolean {
  return true
}

export async function getFile(path: string) {
  return repo.has(path) ? { content: repo.get(path)!, sha: `sha-${path}` } : null
}

export async function putFile(path: string, content: string, message: string) {
  if (failure.next) {
    const error = failure.next
    failure.next = null
    throw error
  }
  repo.set(path, content)
  commits.push(message)
  return { sha: 'new-sha' }
}

export async function deleteFile(path: string) {
  repo.delete(path)
}

export async function listDir() {
  return []
}

export async function getRawFile() {
  return null
}
