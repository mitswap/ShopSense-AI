import { createClient } from '@supabase/supabase-js'
import { runRootCausePipeline } from '../lib/intelligence/pipeline.mjs'
import { hasOpenRouter, chatCompletion } from '../openrouter.mjs'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

export async function handleRootCause(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = parseBody(req)
  const { productQuery, context, locale = 'en', analytics, sessionId, shopId } = body
  try {
    const result = await runRootCausePipeline(getSupabaseAdmin(), {
      alert: { title: productQuery, message: context },
      analytics,
      locale,
      sessionId,
      shopId,
    })
    return res.status(200).json({
      answerBn: result.summaryBn,
      causes: result.likelyCauses ?? [],
      actions: result.actions ?? [],
      method: result.provider ?? 'rules',
    })
  } catch {
    /* fallback */
  }
  if (hasOpenRouter()) {
    const text = await chatCompletion(
      `Bangladesh SME analyst. Q: ${productQuery}\nData: ${context}\nJSON: {"answerBn":"..."}`,
    )
    const m = text.match(/\{[\s\S]*\}/)
    if (m) return res.status(200).json({ ...JSON.parse(m[0]), method: 'openrouter' })
  }
  res.status(200).json({ answerBn: context, method: 'context-only' })
}
