/** In-memory session history for contextual RAG (per shop / user session). */

const sessions = new Map()
const MAX_QUERIES = 12
const SESSION_TTL_MS = 2 * 60 * 60 * 1000

function sessionKey(shopId, sessionId) {
  return `${shopId ?? 'default'}::${sessionId ?? 'anon'}`
}

export function appendSessionQuery(shopId, sessionId, query, answer) {
  const key = sessionKey(shopId, sessionId)
  const cur = sessions.get(key) ?? { queries: [], at: Date.now() }
  cur.queries.push({
    q: query.slice(0, 500),
    a: answer?.slice(0, 800) ?? '',
    at: new Date().toISOString(),
  })
  if (cur.queries.length > MAX_QUERIES) {
    cur.queries = cur.queries.slice(-MAX_QUERIES)
  }
  cur.at = Date.now()
  sessions.set(key, cur)
}

export function getSessionHistory(shopId, sessionId) {
  const key = sessionKey(shopId, sessionId)
  const cur = sessions.get(key)
  if (!cur) return []
  if (Date.now() - cur.at > SESSION_TTL_MS) {
    sessions.delete(key)
    return []
  }
  return cur.queries
}
