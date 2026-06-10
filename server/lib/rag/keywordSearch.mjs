import { buildExpandedKnowledgeSeed } from '../../knowledge-data.mjs'

const KNOWLEDGE_INDEX = buildExpandedKnowledgeSeed()

function scoreArticle(article, terms) {
  const hay = `${article.category} ${article.content} ${article.content_bn ?? ''}`.toLowerCase()
  let score = 0
  for (const t of terms) {
    if (t.length < 2) continue
    if (hay.includes(t)) score += t.length > 4 ? 3 : 1
  }
  return score
}

/**
 * Keyword fallback when vector search is weak or unavailable.
 */
export function keywordSearch(query, limit = 5) {
  const terms = query
    .toLowerCase()
    .split(/[\s,।.?!]+/)
    .filter((t) => t.length > 1)

  const ranked = KNOWLEDGE_INDEX.map((a) => ({
    id: a.id,
    title: a.category,
    category: a.category,
    content: `${a.content}\n${a.content_bn ?? ''}`.slice(0, 1200),
    similarity: scoreArticle(a, terms) / 10,
    source: 'keyword',
  }))
    .filter((r) => r.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return ranked
}
