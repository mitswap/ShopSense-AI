import { createClient } from '@supabase/supabase-js'
import { hybridRetrieve } from '../lib/rag/retrieval.mjs'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

export async function handleRagSearch(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { query, locale, shopId, days } = parseBody(req)
  if (!query) return res.status(400).json({ error: 'query required' })
  try {
    const { chunks, ragMode } = await hybridRetrieve(getSupabaseAdmin(), {
      query,
      locale: locale ?? 'en',
      shopId,
      days: days ?? 30,
      limit: 4,
    })
    res.status(200).json({
      mode: ragMode,
      chunks: chunks.map((r) => ({
        id: r.id,
        category: r.category,
        content: r.content,
        contentBn: r.content_bn ?? r.content,
      })),
    })
  } catch {
    res.status(200).json({ mode: 'keyword', chunks: [] })
  }
}
