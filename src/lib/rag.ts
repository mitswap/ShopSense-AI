import type { KnowledgeChunk } from '../types'
import { getIntelligenceSessionId, getIntelligenceShopId } from './intelligenceSession'
import { retrieveForAlerts } from './knowledge'
import { apiFetch } from './apiClient'

export type RagMode = 'vector' | 'keyword' | 'none'

export interface RagResult {
  chunks: KnowledgeChunk[]
  mode: RagMode
}

export async function retrieveRag(
  query: string,
  alertTypes: string[],
  locale: 'en' | 'bn' = 'en',
): Promise<RagResult> {
  try {
    const res = await apiFetch('/api/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        locale,
        shopId: getIntelligenceShopId(),
        sessionId: getIntelligenceSessionId(),
        days: 30,
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as {
        mode: string
        chunks: { id: string; content: string; contentBn: string; category: string }[]
      }
      if (data.chunks?.length > 0) {
        return {
          mode: data.mode === 'vector' ? 'vector' : 'keyword',
          chunks: data.chunks.map((c) => ({
            id: c.id,
            content: c.content,
            contentBn: c.contentBn,
            category: c.category,
          })),
        }
      }
    }
  } catch {
    /* API offline */
  }

  return {
    mode: 'keyword',
    chunks: retrieveForAlerts(alertTypes),
  }
}

export async function seedVectorKnowledge(): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch('/api/rag/seed', { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Seed failed')
  return { ok: true, message: (data as { message?: string }).message ?? 'Seeded' }
}
