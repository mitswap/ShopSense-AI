/**
 * OpenRouter — OpenAI-compatible chat + embeddings (no paid Gemini key required)
 */
const BASE = 'https://openrouter.ai/api/v1'

export function hasOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY)
}

export function getChatModel() {
  return (
    process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-001'
  )
}

export function getEmbedModel() {
  return process.env.OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-small'
}

export function getEmbedDimensions() {
  const d = Number(process.env.OPENROUTER_EMBED_DIMENSIONS ?? 1536)
  return Number.isFinite(d) ? d : 1536
}

async function openRouterFetch(path, body) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY not set')
  const referer =
    process.env.OPENROUTER_SITE_URL ??
    process.env.FRONTEND_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    'http://localhost:5173'

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': 'ShopSense AI',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error?.message ?? data.message ?? `OpenRouter ${res.status}`)
  }
  return data
}

/** Chat completion — returns assistant text */
export async function chatCompletion(prompt, options = {}) {
  const data = await openRouterFetch('/chat/completions', {
    model: options.model ?? getChatModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
  })
  return data.choices?.[0]?.message?.content ?? ''
}

/** Embedding vector for pgvector */
export async function embedText(text) {
  const data = await openRouterFetch('/embeddings', {
    model: getEmbedModel(),
    input: text,
  })
  const values = data.data?.[0]?.embedding
  if (!values?.length) throw new Error('Empty embedding from OpenRouter')
  return values
}

export function hasLlm() {
  return hasOpenRouter() || Boolean(process.env.GEMINI_API_KEY)
}

/** Alias for intelligence layer */
export const createEmbedding = embedText
