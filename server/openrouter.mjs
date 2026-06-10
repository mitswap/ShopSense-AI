/**
 * OpenRouter — OpenAI-compatible chat + embeddings (no paid Gemini key required)
 */
const BASE = 'https://openrouter.ai/api/v1'
const DEFAULT_CHAT_MODEL = 'qwen/qwen3.6-flash'
const DEFAULT_CHAT_FALLBACKS = [
  '~google/gemini-flash-latest',
  'openai/gpt-chat-latest',
]
const RETRYABLE_STATUS_CODES = new Set([401, 402, 403, 408, 409, 429])
let preferredOpenRouterKeyIndex = 0

function getOpenRouterKeys() {
  return [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_FALLBACK,
  ]
    .map((key) => String(key ?? '').trim())
    .filter(Boolean)
    .filter((key, index, items) => items.indexOf(key) === index)
}

function getOrderedOpenRouterKeys() {
  const keys = getOpenRouterKeys()
  if (keys.length <= 1) return keys
  const start = Math.max(0, Math.min(preferredOpenRouterKeyIndex, keys.length - 1))
  return [...keys.slice(start), ...keys.slice(0, start)]
}

export function hasOpenRouter() {
  return getOpenRouterKeys().length > 0
}

export function getChatModel() {
  return process.env.OPENROUTER_MODEL ?? DEFAULT_CHAT_MODEL
}

export function getEmbedModel() {
  return process.env.OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-small'
}

export function getEmbedDimensions() {
  const d = Number(process.env.OPENROUTER_EMBED_DIMENSIONS ?? 1536)
  return Number.isFinite(d) ? d : 1536
}

function getChatModelCandidates(explicitModel) {
  const envFallbacks = String(process.env.OPENROUTER_MODEL_FALLBACKS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return [...new Set([
    explicitModel,
    getChatModel(),
    ...envFallbacks,
    ...DEFAULT_CHAT_FALLBACKS,
    DEFAULT_CHAT_MODEL,
  ].filter(Boolean))]
}

async function openRouterFetch(path, body) {
  const keys = getOrderedOpenRouterKeys()
  if (!keys.length) throw new Error('OPENROUTER_API_KEY not set')
  const referer =
    process.env.OPENROUTER_SITE_URL ??
    process.env.FRONTEND_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    'http://localhost:5173'
  const errors = []

  for (const [orderedIndex, key] of keys.entries()) {
    try {
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
      if (res.ok) {
        const originalIndex = getOpenRouterKeys().indexOf(key)
        if (originalIndex >= 0) preferredOpenRouterKeyIndex = originalIndex
        return data
      }

      const message = data.error?.message ?? data.message ?? `OpenRouter ${res.status}`
      errors.push(`key${orderedIndex + 1}: ${message}`)
      if (!(RETRYABLE_STATUS_CODES.has(res.status) || res.status >= 500)) {
        throw new Error(message)
      }
    } catch (error) {
      const message = error?.message ?? 'OpenRouter request failed'
      if (!errors.includes(`key${orderedIndex + 1}: ${message}`)) {
        errors.push(`key${orderedIndex + 1}: ${message}`)
      }
    }
  }

  throw new Error(errors.join(' | ') || 'OpenRouter request failed')
}

/** Chat completion — returns assistant text */
export async function chatCompletionWithMeta(prompt, options = {}) {
  const models = getChatModelCandidates(options.model)
  const errors = []

  for (const model of models) {
    try {
      const data = await openRouterFetch('/chat/completions', {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 2048,
      })

      return {
        text: data.choices?.[0]?.message?.content ?? '',
        model,
      }
    } catch (error) {
      errors.push(`${model}: ${error?.message ?? 'OpenRouter error'}`)
    }
  }

  throw new Error(errors.join(' | ') || 'OpenRouter chat failed')
}

export async function chatCompletion(prompt, options = {}) {
  const result = await chatCompletionWithMeta(prompt, options)
  return result.text
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
