import type { DocsAccess, DocsAccessStatus, DocsContent, DocsLiveSnapshot } from './docsTypes'
import { docsAdminHeader } from './auth'
import { apiFetch, apiHref } from './apiClient'

const ADMIN_KEY = 'docs-admin-creds'

export function saveAdminCreds(username: string, password: string) {
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify({ username, password }))
}

export function getAdminCreds(): { username: string; password: string } | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY)
    return raw ? (JSON.parse(raw) as { username: string; password: string }) : null
  } catch {
    return null
  }
}

export function clearAdminCreds() {
  sessionStorage.removeItem(ADMIN_KEY)
}

function adminHeaders(): HeadersInit {
  const creds = getAdminCreds()
  if (!creds) return {}
  return { 'X-Docs-Admin': docsAdminHeader(creds.username, creds.password) }
}

export async function fetchDocsAccess(): Promise<DocsAccessStatus & { access?: DocsAccess }> {
  const res = await apiFetch('/api/docs/access')
  return res.json()
}

export async function fetchDocsContent(preview = false, draft = false): Promise<{ content: DocsContent } | { error: string }> {
  const q = new URLSearchParams()
  if (preview) q.set('preview', '1')
  if (draft) q.set('draft', '1')
  const res = await apiFetch(`/api/docs/content?${q}`, { headers: preview ? adminHeaders() : {} })
  if (!res.ok) return { error: (await res.json()).message ?? 'unavailable' }
  return res.json()
}

export async function fetchDocsLive(): Promise<DocsLiveSnapshot> {
  const res = await apiFetch('/api/docs/live')
  return res.json()
}

export async function adminLogin(username: string, password: string): Promise<boolean> {
  const res = await apiFetch('/api/docs/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) return false
  saveAdminCreds(username, password)
  return true
}

export async function adminSaveAccess(access: Partial<DocsAccess>): Promise<unknown> {
  const creds = getAdminCreds()
  const res = await apiFetch('/api/docs/admin/access', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ ...access, username: creds?.username, password: creds?.password }),
  })
  return res.json()
}

export async function adminSaveContent(content: DocsContent, asDraft = true): Promise<unknown> {
  const creds = getAdminCreds()
  const res = await apiFetch('/api/docs/admin/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ content, asDraft, username: creds?.username, password: creds?.password }),
  })
  return res.json()
}

export async function adminPublish(): Promise<unknown> {
  const creds = getAdminCreds()
  const res = await apiFetch('/api/docs/admin/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ username: creds?.username, password: creds?.password }),
  })
  return res.json()
}

export function exportMarkdownUrl(): string {
  return apiHref('/api/docs/export/markdown')
}
