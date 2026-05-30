import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { KNOWLEDGE_SEED } from './knowledge-data.mjs'
import { ruleBasedMappings } from './schema-rules.mjs'
import {
  chatCompletion,
  embedText,
  hasLlm,
  hasOpenRouter,
} from './openrouter.mjs'
import {
  isOllamaAvailable,
  isLocalOllamaAvailable,
  hasHuggingFace,
  getOllamaModel,
  getOllamaReasonerModel,
} from './lib/llm/ollamaClient.mjs'
import { chunkAllArticles } from './lib/rag/variableChunking.mjs'
import { getCachedEmbed, setCachedEmbed } from './lib/rag/cache.mjs'
import { hybridRetrieve } from './lib/rag/retrieval.mjs'
import {
  runInsightPipeline,
  runNlQueryPipeline,
  runRootCausePipeline,
} from './lib/intelligence/pipeline.mjs'
import { registerDocsRoutes } from './lib/docs/docsRoutes.mjs'
import { generateText } from './lib/llm/llmRouter.mjs'

const app = express()
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)

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

async function anyLlmReady() {
  if (hasOpenRouter()) return true
  return isOllamaAvailable()
}

app.get('/api/status', async (_req, res) => {
  const sb = getSupabaseAdmin()
  let ragChunkCount = 0
  let vectorReady = false
  const ollamaUp = await isOllamaAvailable()
  const localOllamaUp = await isLocalOllamaAvailable()
  const hfUp = hasHuggingFace()

  if (sb) {
    const { count } = await sb
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })
    ragChunkCount = count ?? 0
    const { data: withEmb } = await sb
      .from('knowledge_chunks')
      .select('id')
      .not('embedding', 'is', null)
      .limit(1)
    vectorReady = (withEmb?.length ?? 0) > 0
  }

  res.json({
    ok: true,
    layers: {
      frontend: { ready: true, label: 'React + Vite + Tailwind' },
      csvPipeline: { ready: true, label: 'Adaptive schema ingest (PapaParse)' },
      analytics: { ready: true, label: 'Decision analytics engine' },
      forecasting: { ready: true, label: 'Forecast (MA + data festivals)' },
      graph: { ready: true, label: 'Knowledge graph (product↔category↔festival)' },
      schemaAI: {
        ready: hasLlm(),
        label: 'LLM schema mapping (OpenRouter)',
        hint: hasLlm() ? null : 'Set OPENROUTER_API_KEY in .env',
      },
      supabase: {
        ready: Boolean(sb),
        label: 'Supabase Postgres',
        hint: sb ? null : 'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY',
      },
      vectorDb: {
        ready: vectorReady,
        label: 'Supabase pgvector',
        chunkCount: ragChunkCount,
        hint: vectorReady ? null : 'POST /api/rag/seed after SQL migrations',
      },
      rag: {
        ready: vectorReady || hasOpenRouter(),
        label: 'Contextual + agentic RAG (hybrid)',
        mode: vectorReady ? 'hybrid-vector-keyword' : 'keyword-fallback',
      },
      agentic: {
        ready: true,
        label: 'Agent orchestrator (inventory · sales · insight · translation)',
      },
      ollama: {
        ready: ollamaUp,
        label: localOllamaUp
          ? `Ollama local LLM (${getOllamaModel()})`
          : hfUp
            ? `HF cloud LLM (${getOllamaModel()})`
            : `Ollama local LLM (${getOllamaModel()})`,
        hint: ollamaUp ? null : hfUp ? null : 'Run: ollama serve && ollama pull llama3',
      },
      ollamaReasoner: {
        ready: ollamaUp,
        label: `Ollama reasoner (${getOllamaReasonerModel()})`,
        hint: ollamaUp ? null : hfUp ? null : 'ollama pull deepseek-r1:1.5b',
      },
      huggingface: {
        ready: hfUp,
        label: 'Hugging Face Inference Providers',
        hint: hfUp ? null : 'Set HF_TOKEN in environment',
      },
      openrouter: {
        ready: hasOpenRouter(),
        label: 'OpenRouter LLM + embeddings',
        hint: hasOpenRouter() ? null : 'Set OPENROUTER_API_KEY in .env',
      },
      localization: { ready: true, label: 'English UI · Bengali owner advice' },
      deployment: { ready: true, label: 'Vercel + serverless API ready' },
    },
  })
})

app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    openrouter: hasOpenRouter(),
    huggingface: hasHuggingFace(),
    ollama: await isOllamaAvailable(),
    ollamaReasoner: getOllamaReasonerModel(),
    supabase: Boolean(getSupabaseAdmin()),
  })
})

app.get('/api/intelligence/health', async (_req, res) => {
  const localOllamaUp = await isLocalOllamaAvailable()
  const hfUp = hasHuggingFace()
  res.json({
    ok: true,
    ollama: await isOllamaAvailable(),
    ollamaModel: getOllamaModel(),
    ollamaReasonerModel: getOllamaReasonerModel(),
    openrouter: hasOpenRouter(),
    huggingface: hfUp,
    agenticRag: true,
    reasoningMode: localOllamaUp ? 'local-ollama' : hfUp ? 'huggingface-cloud' : 'openrouter-cloud',
  })
})

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
    const articles = KNOWLEDGE_SEED.map((item) => ({
      id: item.id,
      title: item.category,
      category: item.category,
      content: `${item.content}\n\n${item.content_bn}`,
    }))
    const chunked = chunkAllArticles(articles, 'global')
    const rows = []
    for (const ch of chunked) {
      const baseId = ch.id.split('::')[0]
      const orig = KNOWLEDGE_SEED.find((k) => k.id === baseId)
      let embedding = getCachedEmbed(ch.content)
      if (!embedding) {
        embedding = await embedText(ch.content)
        setCachedEmbed(ch.content, embedding)
      }
      const metaLine = `<!--chunk:${JSON.stringify(ch.metadata ?? {})}-->`
      rows.push({
        id: ch.id,
        category: ch.category,
        content: `${metaLine}\n${ch.content}`,
        content_bn: orig?.content_bn ?? ch.content,
        embedding,
      })
    }
    const { error } = await sb.from('knowledge_chunks').upsert(rows)
    if (error) throw error
    return res.json({
      ok: true,
      seeded: rows.length,
      chunks: chunked.length,
      message: 'Variable-chunk vector RAG knowledge base ready',
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/rag/search', async (req, res) => {
  const { query, locale, shopId, days } = req.body
  if (!query) return res.status(400).json({ error: 'query required' })

  const sb = getSupabaseAdmin()
  try {
    const { chunks, ragMode } = await hybridRetrieve(sb, {
      query,
      locale: locale ?? 'en',
      shopId,
      days: days ?? 30,
      limit: 4,
    })
    return res.json({
      mode: ragMode,
      chunks: chunks.map((r) => ({
        id: r.id,
        category: r.category,
        content: r.content,
        contentBn: r.content_bn ?? r.content,
        similarity: r.similarity,
        title: r.title,
      })),
    })
  } catch (e) {
    console.warn('hybridRetrieve failed', e.message)
    return res.json({ mode: 'keyword', chunks: [] })
  }
})

app.post('/api/schema/detect', async (req, res) => {
  const { columns, sampleRows } = req.body
  if (!columns?.length) return res.status(400).json({ error: 'columns required' })

  try {
    const prompt = `You are a retail CSV schema mapper for Bangladesh clothing SMEs.
Map uploaded columns to canonical fields ONLY from this list:
date, product_name, category, quantity, unit_price, revenue, stock, unit_cost, weather, season, festival, location, branch, supplier

Uploaded columns: ${JSON.stringify(columns)}
Sample rows: ${JSON.stringify((sampleRows ?? []).slice(0, 3))}

Return JSON only:
{"mappings":[{"sourceColumn":"...","canonicalField":"...","confidence":0.95}],"unmapped":[]}`

    const gen = await generateText(prompt, {
      maxTokens: 512,
      json: true,
      timeoutMs: 20_000,
    })
    const text = gen?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed?.mappings) && parsed.mappings.length) {
        const mappings = parsed.mappings
          .filter((m) => m && typeof m.sourceColumn === 'string' && typeof m.canonicalField === 'string')
          .map((m) => ({
            sourceColumn: m.sourceColumn,
            canonicalField: m.canonicalField,
            confidence: Number(m.confidence ?? 0.8),
          }))
        if (mappings.length) {
          const mapped = new Set(mappings.map((m) => m.sourceColumn))
          return res.json({
            mappings,
            unmapped: columns.filter((c) => !mapped.has(c)),
            method: 'llm',
          })
        }
      }
    }
  } catch (e) {
    console.warn('LLM schema detect failed', e.message)
  }

  return res.json(ruleBasedMappings(columns))
})

app.post('/api/root-cause', async (req, res) => {
  const { productQuery, context, locale = 'en', analytics, sessionId, shopId } = req.body

  if (await anyLlmReady()) {
    try {
      const result = await runRootCausePipeline(getSupabaseAdmin(), {
        alert: { title: productQuery, message: context },
        analytics,
        locale,
        sessionId,
        shopId,
      })
      return res.json({
        answerBn: result.summaryBn,
        causes: result.likelyCauses ?? [],
        actions: result.actions ?? [],
        method: result.provider ?? 'agentic',
      })
    } catch (e) {
      console.warn('Agentic root-cause failed', e.message)
    }
  }

  if (!hasOpenRouter()) {
    return res.json({
      answerBn:
        context || (locale === 'bn' ? 'Ollama/HF চালু করুন বা OpenRouter সেট করুন' : 'Start Ollama/Hugging Face or set OpenRouter'),
      method: 'context-only',
    })
  }

  const prompt = `${locale === 'bn' ? 'বাংলাদেশি পোশাক SME বিশ্লেষক।' : 'Bangladesh apparel SME analyst.'}

Question: ${productQuery}
Data: ${context}

JSON: {"answerBn":"...","causes":["..."],"actions":["..."],"confidence":0.85}`

  try {
    const text = await chatCompletion(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return res.json({ ...JSON.parse(jsonMatch[0]), method: 'openrouter' })
    return res.json({ answerBn: text.slice(0, 800), method: 'openrouter' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/query/nl', async (req, res) => {
  const {
    query,
    localAnswer,
    dataContext,
    locale = 'en',
    shopId,
    sessionId,
    shopName,
    analytics,
    forecasts,
    alerts,
    products,
    sales,
    daysFilter,
  } = req.body

  if (await anyLlmReady()) {
    try {
      const result = await runNlQueryPipeline(getSupabaseAdmin(), {
        question: query,
        localAnswer,
        dataContext:
          typeof dataContext === 'string'
            ? { snippet: dataContext, localAnswer }
            : dataContext ?? {
              analytics,
              products: products ?? [],
              sales: sales ?? [],
              forecasts: forecasts ?? [],
              alerts: alerts ?? [],
            },
        locale,
        shopId,
        sessionId,
        shopName,
        analytics,
        forecasts,
        alerts,
        daysFilter: daysFilter ?? 30,
      })
      return res.json({
        answerBn: result.answerBn,
        intent: result.intent,
        dataUsed: result.dataUsed,
        method: result.provider ?? 'agentic',
        ragMode: result.ragMode,
      })
    } catch (e) {
      console.warn('Agentic NL query failed', e.message)
    }
  }

  if (!hasOpenRouter()) {
    return res.json({ answerBn: localAnswer, method: 'local' })
  }

  const prompt = `SME retail assistant. Answer in ${locale === 'bn' ? 'Bengali' : 'English'} using ONLY this data:
${typeof dataContext === 'string' ? dataContext : JSON.stringify(dataContext)}

Question: ${query}
Local engine said: ${localAnswer}

JSON: {"answerBn":"...","dataUsed":["field1"]}`

  try {
    const text = await chatCompletion(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return res.json({ ...JSON.parse(jsonMatch[0]), method: 'openrouter' })
    return res.json({ answerBn: text, method: 'openrouter' })
  } catch (err) {
    return res.json({ answerBn: localAnswer, method: 'local' })
  }
})

app.post('/api/insight', async (req, res) => {
  let {
    shopName,
    analytics,
    forecasts,
    alerts,
    ragChunks,
    locale,
    ragQuery,
    decisionFeed,
    graphContext,
    graph,
    products,
    sales,
    adviceSeed,
    shopId,
    sessionId,
    daysFilter,
  } = req.body

  try {
    const structured = await runInsightPipeline(getSupabaseAdmin(), {
      shopName,
      analytics,
      forecasts,
      alerts,
      locale: locale ?? 'bn',
      decisionFeed,
      graph: graph ?? graphContext,
      products,
      sales,
      adviceSeed,
      shopId,
      sessionId,
      daysFilter: daysFilter ?? 30,
      dataContext: { graphContext, products, sales, graph },
    })
    return res.json(structured)
  } catch (e) {
    console.warn('Structured insight failed, falling back', e.message)
  }

  if (!hasOpenRouter()) {
    return res.status(503).json({
      error: 'Insight engine failed and no LLM fallback. Check API logs.',
    })
  }

  const sb = getSupabaseAdmin()
  if ((!ragChunks || ragChunks.length === 0) && ragQuery && sb) {
    try {
      const embedding = await embedText(ragQuery)
      const { data } = await sb.rpc('match_knowledge_chunks', {
        query_embedding: embedding,
        match_count: 4,
      })
      if (data?.length) {
        ragChunks = data.map((r) => ({
          id: r.id,
          content: r.content,
          contentBn: r.content_bn,
          category: r.category,
        }))
      }
    } catch (e) {
      console.warn(e)
    }
  }

  const ragText = (ragChunks ?? [])
    .map((c, i) => `[${i + 1}] ${locale === 'en' ? c.content : c.contentBn ?? c.content}`)
    .join('\n')

  const isEnglish = locale === 'en'
  const metricsText = `
${isEnglish ? 'Shop' : 'দোকান'}: ${shopName}
${isEnglish ? 'Total stock value (৳)' : 'মোট স্টক মূল্য (৳)'}: ${Math.round(analytics?.totalStockValue ?? 0)}
${isEnglish ? 'Total SKU' : 'মোট SKU'}: ${analytics?.totalSkus ?? 0}
${isEnglish ? 'Low stock risk' : 'কম স্টক ঝুঁকি'}: ${analytics?.lowStockCount ?? 0}
${isEnglish ? 'Overstock' : 'অতিরিক্ত স্টক'}: ${analytics?.overstockCount ?? 0}
${isEnglish ? '30-day sales (৳)' : '৩০ দিন বিক্রয় (৳)'}: ${Math.round(analytics?.totalRevenue30d ?? 0)}

${isEnglish ? 'Top risk products' : 'শীর্ষ ঝুঁকি পণ্য'}:
${(forecasts ?? [])
  .filter((f) => f.risk === 'high' || f.risk === 'medium')
  .slice(0, 8)
  .map(
    (f) =>
      isEnglish
        ? `- ${f.name} (${f.sku}): stock ${f.currentStock}, est daily sales ~${f.avgDailySales}, ${f.daysUntilStockout ?? 'N/A'} days left, reorder ${f.suggestedReorder}`
        : `- ${f.nameBn ?? f.name} (${f.sku}): স্টক ${f.currentStock}, দৈনিক বিক্রয় ~${f.avgDailySales}, ${f.daysUntilStockout ?? 'N/A'} দিন বাকি, অর্ডার ${f.suggestedReorder}`,
  )
  .join('\n')}

${isEnglish ? 'Alerts' : 'সতর্কতা'}:
${(alerts ?? []).map((a) => `- ${a.messageBn}`).join('\n')}
`.trim()

  const prompt = `${isEnglish ? 'You are an SME advisor for Bangladesh apparel retail. Use only the data below and do not invent numbers.' : 'তুমি বাংলাদেশের পোশাক খুচরা ব্যবসার SME উপদেষ্টা। শুধুমাত্র নিচের ডেটা ব্যবহার করো — সংখ্যা উদ্ভাবনা করো না।'}

${metricsText}

${isEnglish ? 'Knowledge base (RAG)' : 'জ্ঞান ভান্ডার (RAG)'}:
${ragText || (isEnglish ? '(No source)' : '(কোনো সূত্র নেই)')}

Decision feed:
${(decisionFeed ?? []).slice(0, 5).map((d) => `- ${d.titleBn}: ${d.bodyBn}`).join('\n')}

${graphContext ?? ''}

${isEnglish ? 'Answer in English JSON' : 'উত্তর বাংলায় JSON'}:
{
  "summaryBn": "${isEnglish ? '2-3 sentence summary' : '২-৩ বাক্য সারাংশ'}",
  "recommendations": [{"titleBn":"","actionBn":"","priority":1,"reasonBn":""}],
  "ragSources": ["${isEnglish ? 'source 1' : 'সূত্র ১'}"]
}`

  try {
    const text = await chatCompletion(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return res.json({ ...parsed, ragMode: ragChunks?.length ? 'vector' : 'fallback' })
    }

    return res.json({
      summaryBn: text.slice(0, 500),
      recommendations: [],
      ragSources: (ragChunks ?? []).map((c) => c.contentBn?.slice(0, 80) ?? ''),
      ragMode: 'fallback',
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message ?? 'OpenRouter error' })
  }
})

registerDocsRoutes(app, { getSupabaseAdmin, hasOpenRouter })

export { app }
