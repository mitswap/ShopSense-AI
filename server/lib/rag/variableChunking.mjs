/**
 * Variable chunking by content size + semantic boundaries (paragraphs, product blocks).
 * Metadata encoded in chunk id suffix for pgvector without schema migration.
 */

const SMALL_MAX = 300
const MEDIUM_MAX = 800
const LARGE_MAX = 1500

function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

function splitParagraphs(text) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * @param {{ id: string, title: string, category: string, content: string, shopId?: string }} article
 */
export function chunkArticle(article) {
  const shopId = article.shopId ?? 'global'
  const baseMeta = {
    shop_id: shopId,
    category: article.category,
    chunk_type: 'knowledge',
    timestamp: new Date().toISOString(),
  }

  const full = `# ${article.title}\n\n${article.content}`
  const tokens = estimateTokens(full)

  if (tokens <= SMALL_MAX) {
    return [
      {
        id: `${article.id}::c0`,
        title: article.title,
        category: article.category,
        content: full,
        metadata: { ...baseMeta, chunk_size: 'small', token_est: tokens },
      },
    ]
  }

  const paragraphs = splitParagraphs(article.content)
  const target =
    tokens <= MEDIUM_MAX * 2 ? MEDIUM_MAX : LARGE_MAX

  const chunks = []
  let buf = `# ${article.title}\n\n`
  let idx = 0

  const flush = () => {
    if (buf.trim().length < 20) return
    chunks.push({
      id: `${article.id}::c${idx}`,
      title: article.title,
      category: article.category,
      content: buf.trim(),
      metadata: {
        ...baseMeta,
        chunk_size: target <= MEDIUM_MAX ? 'medium' : 'large',
        chunk_index: idx,
        token_est: estimateTokens(buf),
      },
    })
    idx += 1
    buf = `# ${article.title} (continued)\n\n`
  }

  for (const para of paragraphs) {
    const isProductBlock =
      /^[-*]\s/.test(para) ||
      /^SKU|Product|পণ্য/i.test(para) ||
      /^\d+\.\s/.test(para)

    const next = buf + (buf.endsWith('\n\n') ? '' : '\n\n') + para
    if (estimateTokens(next) > target && !isProductBlock && buf.length > 80) {
      flush()
      buf += para
    } else if (estimateTokens(next) > target && isProductBlock) {
      flush()
      buf += para
    } else {
      buf = next
    }
  }
  if (buf.trim().length > 20) flush()

  return chunks.length ? chunks : [{ id: `${article.id}::c0`, title: article.title, category: article.category, content: full, metadata: baseMeta }]
}

/**
 * @param {Array<{ id: string, title: string, category: string, content: string }>} articles
 */
export function chunkAllArticles(articles, shopId = 'global') {
  return articles.flatMap((a) => chunkArticle({ ...a, shopId }))
}
