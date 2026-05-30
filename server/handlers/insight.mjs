import { createClient } from '@supabase/supabase-js'
import { runInsightPipeline } from '../lib/intelligence/pipeline.mjs'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

export async function handleInsight(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = parseBody(req)
  const result = await runInsightPipeline(getSupabaseAdmin(), {
    ...body,
    locale: body.locale ?? 'bn',
    daysFilter: body.daysFilter ?? 30,
  })
  res.status(200).json(result)
}
