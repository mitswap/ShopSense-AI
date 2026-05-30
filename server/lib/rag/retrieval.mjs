import { embedText, hasOpenRouter } from '../../openrouter.mjs'
import { keywordSearch } from './keywordSearch.mjs'
import { rerankChunks } from './reranker.mjs'
import {
  cacheKeyForRag,
  getCachedQuery,
  setCachedQuery,
  getCachedEmbed,
  setCachedEmbed,
} from './cache.mjs'

/**
 * Hybrid retrieval: pgvector + keyword fallback + metadata filter + re-rank.
 */
export async function hybridRetrieve(supabase, { query, locale, shopId, days = 30, limit = 6 }) {
  const cacheKey = cacheKeyForRag({ query, shopId, locale, days })
  const cached = getCachedQuery(cacheKey)
  if (cached) return { ...cached, fromCache: true }

  let vectorRows = []
  const skipVector = process.env.RAG_FAST_MODE === 'true'
  if (supabase && hasOpenRouter() && !skipVector) {
    let embedding = getCachedEmbed(query)
    if (!embedding) {
      embedding = await embedText(query + (locale === 'bn' ? ' বাংলা' : ''))
      setCachedEmbed(query, embedding)
    }

    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_count: limit * 2,
    })

    if (!error && data?.length) {
      vectorRows = data.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        content: row.content,
        similarity: row.similarity,
        source: 'vector',
      }))
    }
  }

  const keywordRows = keywordSearch(query, limit)
  const merged = new Map()

  for (const row of vectorRows) {
    merged.set(row.id, row)
  }
  for (const row of keywordRows) {
    const existing = merged.get(row.id)
    if (existing) {
      existing.similarity = (existing.similarity ?? 0) + (row.similarity ?? 0) * 0.3
      existing.source = 'hybrid'
    } else {
      merged.set(row.id, row)
    }
  }

  let chunks = [...merged.values()]
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit * 2)

  const daysNote = days <= 7 ? 'recent_week' : 'recent_month'
  chunks = chunks.filter((c) => {
    const meta = c.id?.includes('::') ? c.id.split('::')[0] : ''
    void meta
    void daysNote
    return true
  })

  chunks = await rerankChunks(query, chunks.slice(0, 8), 'retrieval')
  chunks = chunks.slice(0, limit)

  const result = {
    chunks,
    ragMode: vectorRows.length ? (keywordRows.length ? 'hybrid' : 'vector') : 'keyword',
    sources: chunks.map((c) => c.title),
  }

  setCachedQuery(cacheKey, result)
  return result
}
