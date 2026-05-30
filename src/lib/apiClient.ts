const apiBase = String((import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/$/, '')

export function apiUrl(path: string): string {
  // When unset, default to same-origin `/api/...`.
  if (!apiBase) return path
  if (!path.startsWith('/')) return `${apiBase}/${path}`
  return `${apiBase}${path}`
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(input), init)
}

export function apiHref(path: string): string {
  return apiUrl(path)
}

