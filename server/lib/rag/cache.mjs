const queryCache = new Map()
const embedCache = new Map()

const QUERY_TTL_MS = Number(process.env.RAG_QUERY_CACHE_TTL_MS ?? 5 * 60 * 1000)
const EMBED_TTL_MS = Number(process.env.RAG_EMBED_CACHE_TTL_MS ?? 60 * 60 * 1000)

function hashKey(parts) {
  return parts.join('|').slice(0, 500)
}

export function getCachedQuery(key) {
  const entry = queryCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > QUERY_TTL_MS) {
    queryCache.delete(key)
    return null
  }
  return entry.value
}

export function setCachedQuery(key, value) {
  queryCache.set(key, { value, at: Date.now() })
  if (queryCache.size > 200) {
    const oldest = queryCache.keys().next().value
    queryCache.delete(oldest)
  }
}

export function getCachedEmbed(text) {
  const key = hashKey(['embed', text])
  const entry = embedCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > EMBED_TTL_MS) return null
  return entry.value
}

export function setCachedEmbed(text, vector) {
  embedCache.set(hashKey(['embed', text]), { value: vector, at: Date.now() })
}

export function cacheKeyForRag({ query, shopId, locale, days }) {
  return hashKey(['rag', query, shopId ?? 'global', locale ?? 'en', String(days ?? 30)])
}
