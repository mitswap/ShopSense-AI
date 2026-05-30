/**
 * Browser-side types for the local Ollama stack.
 * Runtime calls go through the Express API (`server/lib/llm/ollamaClient.mjs`).
 */

import { apiFetch } from '../apiClient'

export interface OllamaChatResult {
  ok: boolean
  text: string
  error?: string | null
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await apiFetch('/api/intelligence/health')
    if (!res.ok) return false
    const data = (await res.json()) as { ollama?: boolean }
    return Boolean(data.ollama)
  } catch {
    return false
  }
}
