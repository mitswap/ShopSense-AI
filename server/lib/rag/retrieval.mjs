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

const TASK_RETRIEVAL_CONFIG = {
  chat_answer: { limit: 4, categories: ['forecasting', 'festival', 'inventory', 'sales'] },
  owner_advice: { limit: 5, categories: ['forecasting', 'inventory', 'festival', 'pricing'] },
  root_cause: { limit: 4, categories: ['forecasting', 'festival', 'pricing', 'inventory'] },
  graph_explainer: { limit: 4, categories: ['festival', 'merchandising', 'forecasting'] },
  weather_reasoning: { limit: 4, categories: ['weather', 'forecasting', 'inventory'] },
  schema_mapping: { limit: 3, categories: ['data_quality', 'sme'] },
}

function rewriteTaskQuery(query, taskType, locale) {
  const suffixMap = {
    owner_advice:
      locale === 'bn'
        ? 'বাংলাদেশ দোকান পরামর্শ স্টক ছাড় রিঅর্ডার'
        : 'bangladesh shop advice reorder discount grounded evidence',
    root_cause:
      locale === 'bn'
        ? 'মূল কারণ ব্যাখ্যা স্টক বিক্রয় উৎসব'
        : 'root cause stock sales festival grounded explanation',
    graph_explainer:
      locale === 'bn'
        ? 'পণ্য সংযোগ বান্ডেল দোকান ডিসপ্লে'
        : 'product graph bundle merchandising connections',
    weather_reasoning:
      locale === 'bn'
        ? 'আবহাওয়া দোকান ডিসপ্লে বিক্রয়'
        : 'weather retail display stock sales guidance',
    schema_mapping:
      locale === 'bn'
        ? 'csv স্কিমা ম্যাপিং কলাম'
        : 'csv schema mapping retail columns',
  }

  const suffix = suffixMap[taskType] ?? (locale === 'bn' ? 'বাংলাদেশ খুচরা বিশ্লেষণ' : 'bangladesh retail analysis')
  return `${query} ${suffix}`.trim()
}

function scoreCategoryBoost(row, preferredCategories = []) {
  return preferredCategories.includes(row.category) ? 0.08 : 0
}

export async function hybridRetrieve(
  supabase,
  { query, locale, shopId, days = 30, limit = 6, taskType = 'chat_answer' },
) {
  const taskConfig = TASK_RETRIEVAL_CONFIG[taskType] ?? TASK_RETRIEVAL_CONFIG.chat_answer
  const finalLimit = Math.max(limit, taskConfig.limit ?? limit)
  const rewrittenQuery = rewriteTaskQuery(query, taskType, locale)
  const cacheKey = cacheKeyForRag({ query: `${taskType}:${rewrittenQuery}`, shopId, locale, days })
  const cached = getCachedQuery(cacheKey)
  if (cached) return { ...cached, fromCache: true }

  let vectorRows = []
  const skipVector = process.env.RAG_FAST_MODE === 'true'

  if (supabase && hasOpenRouter() && !skipVector) {
    try {
      let embedding = getCachedEmbed(rewrittenQuery)
      if (!embedding) {
        embedding = await embedText(rewrittenQuery + (locale === 'bn' ? ' বাংলা' : ''))
        setCachedEmbed(rewrittenQuery, embedding)
      }

      const { data, error } = await supabase.rpc('match_knowledge_chunks', {
        query_embedding: embedding,
        match_count: finalLimit * 3,
      })

      if (!error && data?.length) {
        vectorRows = data.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          content: row.content,
          content_bn: row.content_bn,
          similarity: row.similarity,
          source: 'vector',
        }))
      }
    } catch (error) {
      console.warn(`RAG vector retrieval skipped: ${error?.message ?? 'embedding failure'}`)
    }
  }

  const keywordRows = keywordSearch(rewrittenQuery, finalLimit * 2).map((row) => ({
    ...row,
    content_bn: row.content_bn ?? row.content,
  }))

  const merged = new Map()
  for (const row of vectorRows) merged.set(row.id, row)

  for (const row of keywordRows) {
    const existing = merged.get(row.id)
    if (existing) {
      existing.similarity =
        (existing.similarity ?? 0) +
        (row.similarity ?? 0) * 0.3 +
        scoreCategoryBoost(row, taskConfig.categories)
      existing.source = 'hybrid'
    } else {
      merged.set(row.id, {
        ...row,
        similarity: (row.similarity ?? 0) + scoreCategoryBoost(row, taskConfig.categories),
      })
    }
  }

  let chunks = [...merged.values()]
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, finalLimit * 2)

  chunks = await rerankChunks(rewrittenQuery, chunks.slice(0, 10), taskType)
  chunks = chunks.slice(0, finalLimit)

  const result = {
    queryUsed: rewrittenQuery,
    chunks,
    ragMode: vectorRows.length ? (keywordRows.length ? 'hybrid' : 'vector') : 'keyword',
    sources: chunks.map((c) => c.title),
  }

  setCachedQuery(cacheKey, result)
  return result
}
