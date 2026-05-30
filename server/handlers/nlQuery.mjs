import { createClient } from '@supabase/supabase-js'
import { runNlQueryPipeline } from '../lib/intelligence/pipeline.mjs'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

export async function handleNlQuery(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = parseBody(req)
  const result = await runNlQueryPipeline(getSupabaseAdmin(), {
    question: body.query,
    localAnswer: body.localAnswer,
    dataContext:
      typeof body.dataContext === 'string'
        ? { snippet: body.dataContext, localAnswer: body.localAnswer }
        : body.dataContext,
    locale: body.locale ?? 'en',
    analytics: body.analytics,
    forecasts: body.forecasts ?? [],
    products: body.products ?? [],
    sales: body.sales ?? [],
    shopId: body.shopId,
    sessionId: body.sessionId,
    daysFilter: body.daysFilter ?? 30,
  })
  res.status(200).json({
    answerBn: result.answerBn,
    intent: result.intent,
    dataUsed: result.dataUsed,
    method: result.provider ?? 'agentic',
    ragMode: result.ragMode,
  })
}
