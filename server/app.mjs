import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { buildExpandedKnowledgeSeed } from './knowledge-data.mjs'
import { embedText, hasOpenRouter } from './openrouter.mjs'
import { chunkAllArticles } from './lib/rag/variableChunking.mjs'
import { getCachedEmbed, setCachedEmbed } from './lib/rag/cache.mjs'
import { registerDocsRoutes } from './lib/docs/docsRoutes.mjs'
import {
  handleHealth,
  handleIntelligenceHealth,
  handleStatus,
} from './handlers/status.mjs'
import { handleInsight } from './handlers/insight.mjs'
import { handleNlQuery } from './handlers/nlQuery.mjs'
import { handleRagSearch } from './handlers/rag.mjs'
import { handleRootCause } from './handlers/rootCause.mjs'
import { handleSchemaDetect } from './handlers/schemaDetect.mjs'
import { handleWeatherAdvice } from './handlers/weather.mjs'
import { handleMemoPreview } from './handlers/memoPreview.mjs'

const app = express()

const corsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://sme-ai-dashboard.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (corsOrigins.includes(origin)) return callback(null, true)
      if (/\.vercel\.app$/i.test(origin)) return callback(null, true)
      callback(null, true)
    },
  }),
)
app.use(express.json({ limit: '2mb' }))

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

app.get('/api/status', handleStatus)
app.get('/api/health', handleHealth)
app.get('/api/intelligence/health', handleIntelligenceHealth)

app.post('/api/rag/seed', async (_req, res) => {
  if (!hasOpenRouter()) {
    return res.status(503).json({ error: 'OPENROUTER_API_KEY required for embeddings' })
  }

  const sb = getSupabaseAdmin()
  if (!sb) {
    return res.status(503).json({
      error: 'SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required for vector seed',
    })
  }

  try {
    const knowledgeItems = buildExpandedKnowledgeSeed()
    const knowledgeById = new Map(knowledgeItems.map((item) => [item.id, item]))
    const articles = knowledgeItems.map((item) => ({
      id: item.id,
      title: item.category,
      category: item.category,
      content: `${item.content}\n\n${item.content_bn}`,
    }))

    const chunked = chunkAllArticles(articles, 'global')
    const rows = []

    for (const chunk of chunked) {
      const baseId = chunk.id.split('::')[0]
      const original = knowledgeById.get(baseId)
      let embedding = getCachedEmbed(chunk.content)

      if (!embedding) {
        embedding = await embedText(chunk.content)
        setCachedEmbed(chunk.content, embedding)
      }

      const metaLine = `<!--chunk:${JSON.stringify(chunk.metadata ?? {})}-->`
      rows.push({
        id: chunk.id,
        category: chunk.category,
        content: `${metaLine}\n${chunk.content}`,
        content_bn: original?.content_bn ?? chunk.content,
        embedding,
      })
    }

    const { error: deleteError } = await sb
      .from('knowledge_chunks')
      .delete()
      .or('id.like.kb-%,id.like.kb-%::%')
    if (deleteError) throw deleteError

    const { error: upsertError } = await sb.from('knowledge_chunks').upsert(rows)
    if (upsertError) throw upsertError

    return res.status(200).json({
      ok: true,
      seeded: rows.length,
      chunks: chunked.length,
      message: 'Variable-chunk vector RAG knowledge base ready',
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message ?? 'RAG seed failed' })
  }
})

app.post('/api/rag/search', handleRagSearch)
app.post('/api/weather/advice', handleWeatherAdvice)
app.post('/api/schema/detect', handleSchemaDetect)
app.post('/api/memo/preview', handleMemoPreview)
app.post('/api/root-cause', handleRootCause)
app.post('/api/query/nl', handleNlQuery)
app.post('/api/insight', handleInsight)

registerDocsRoutes(app, { getSupabaseAdmin, hasOpenRouter })

export { app }
