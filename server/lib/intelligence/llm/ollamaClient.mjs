/**
 * Compatibility LLM client.
 *
 * Runtime order:
 * 1) local Ollama daemon
 * 2) Hugging Face Inference Providers (cloud) via HF_TOKEN
 */

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'
const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'llama3'

const HF_BASE = (
  process.env.HF_BASE_URL ??
  process.env.HUGGINGFACE_BASE_URL ??
  'https://router.huggingface.co/v1'
).replace(/\/$/, '')
const HF_DEFAULT_MODEL =
  process.env.HF_CHAT_MODEL ??
  process.env.HUGGINGFACE_CHAT_MODEL ??
  process.env.HF_MODEL ??
  process.env.HUGGINGFACE_MODEL ??
  'Qwen/Qwen2.5-7B-Instruct:fastest'
const HF_RETRYABLE_STATUS_CODES = new Set([401, 402, 403, 408, 409, 429])

let localHealthCache = { ok: false, at: 0 }
let preferredHfTokenIndex = 0

function getHfTokens() {
  return [
    process.env.HF_TOKEN,
    process.env.HUGGINGFACE_API_KEY,
    process.env.HF_TOKEN_FALLBACK,
    process.env.HUGGINGFACE_API_KEY_FALLBACK,
  ]
    .map((token) => String(token ?? '').trim())
    .filter(Boolean)
    .filter((token, index, items) => items.indexOf(token) === index)
}

function getOrderedHfTokens() {
  const tokens = getHfTokens()
  if (tokens.length <= 1) return tokens
  const start = Math.max(0, Math.min(preferredHfTokenIndex, tokens.length - 1))
  return [...tokens.slice(start), ...tokens.slice(0, start)]
}

export function hasHuggingFace() {
  if (process.env.HF_ENABLED === 'false') return false
  return getHfTokens().length > 0
}

export function getHuggingFaceModel() {
  return HF_DEFAULT_MODEL
}

export function getHuggingFaceReasonerModel() {
  return (
    process.env.HF_REASONER_MODEL ??
    process.env.HUGGINGFACE_REASONER_MODEL ??
    getHuggingFaceModel()
  )
}

export function getOllamaModel() {
  if (hasHuggingFace() && process.env.OLLAMA_FORCE_LOCAL !== 'true') {
    return getHuggingFaceModel()
  }
  return process.env.OLLAMA_MODEL ?? OLLAMA_DEFAULT_MODEL
}

/** Reasoning model for insight/root-cause tasks */
export function getOllamaReasonerModel() {
  if (hasHuggingFace() && process.env.OLLAMA_FORCE_LOCAL !== 'true') {
    return getHuggingFaceReasonerModel()
  }
  return (
    process.env.OLLAMA_REASONER_MODEL ??
    process.env.OLLAMA_MODEL ??
    OLLAMA_DEFAULT_MODEL
  )
}

export function isComplexReasoningTask(taskType) {
  if (process.env.OLLAMA_USE_REASONER !== 'true') return false
  return ['insight', 'root_cause', 'multi_step', 'retrieval'].includes(taskType)
}

export function getOllamaModelForTask(taskType) {
  return isComplexReasoningTask(taskType) ? getOllamaReasonerModel() : getOllamaModel()
}

export async function isLocalOllamaAvailable() {
  // Vercel serverless has no Ollama daemon; Render / Docker / local do.
  if ((process.env.VERCEL || process.env.VERCEL_ENV) && !process.env.RENDER) return false
  if (process.env.OLLAMA_ENABLED === 'false') return false
  const now = Date.now()
  if (now - localHealthCache.at < 15_000) return localHealthCache.ok
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    localHealthCache = { ok: res.ok, at: now }
    return res.ok
  } catch {
    localHealthCache = { ok: false, at: now }
    return false
  }
}

export async function isOllamaAvailable() {
  if (await isLocalOllamaAvailable()) return true
  return hasHuggingFace()
}

function readChoiceText(data) {
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }
  return ''
}

async function chatWithLocalOllama(prompt, options = {}) {
  const model = options.model ?? getOllamaModel()
  const stream = options.stream ?? false
  const think =
    options.think ??
    (process.env.OLLAMA_REASONER_THINK === 'true' ? true : false)

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream,
      think,
      ...(options.format ? { format: options.format } : {}),
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.numPredict ?? Number(process.env.OLLAMA_NUM_PREDICT ?? 384),
      },
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
  })

  if (!res.ok) {
    return { ok: false, text: '', error: `Ollama HTTP ${res.status}`, provider: 'ollama', model }
  }

  if (stream && res.body) {
    let text = ''
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const j = JSON.parse(line)
          text += j.message?.content ?? ''
        } catch {
          /* skip partial */
        }
      }
    }
    return { ok: Boolean(text.trim()), text: text.trim(), error: null, provider: 'ollama', model }
  }

  const data = await res.json()
  const content = data.message?.content ?? ''
  const thinking = data.message?.thinking ?? ''
  const text = content.trim() || thinking.trim()
  return {
    ok: Boolean(text),
    text,
    error: text ? null : 'Empty Ollama response',
    provider: 'ollama',
    model,
  }
}

async function chatWithHuggingFace(prompt, options = {}) {
  const tokens = getOrderedHfTokens()
  if (!tokens.length) {
    return { ok: false, text: '', error: 'HF_TOKEN not set', provider: 'huggingface', model: null }
  }

  const model = options.model ?? getOllamaModelForTask(options.taskType ?? 'chat')
  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.numPredict ?? options.maxTokens ?? Number(process.env.OLLAMA_NUM_PREDICT ?? 384),
    ...(options.format === 'json' ? { response_format: { type: 'json_object' } } : {}),
  }
  const errors = []

  for (const [orderedIndex, token] of tokens.entries()) {
    try {
      const res = await fetch(`${HF_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(options.timeoutMs ?? Number(process.env.HF_TIMEOUT_MS ?? 45_000)),
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const text = readChoiceText(data)
        const originalIndex = getHfTokens().indexOf(token)
        if (originalIndex >= 0) preferredHfTokenIndex = originalIndex
        return {
          ok: Boolean(text),
          text,
          error: text ? null : 'Empty Hugging Face response',
          provider: 'huggingface',
          model,
        }
      }

      const message = data.error?.message ?? data.message ?? `Hugging Face HTTP ${res.status}`
      errors.push(`key${orderedIndex + 1}: ${message}`)
      if (!(HF_RETRYABLE_STATUS_CODES.has(res.status) || res.status >= 500)) {
        return {
          ok: false,
          text: '',
          error: message,
          provider: 'huggingface',
          model,
        }
      }
    } catch (error) {
      errors.push(`key${orderedIndex + 1}: ${error?.message ?? 'Hugging Face request failed'}`)
    }
  }
  return {
    ok: false,
    text: '',
    error: errors.join(' | ') || 'Hugging Face request failed',
    provider: 'huggingface',
    model,
  }
}

export async function localOllamaChat(prompt, options = {}) {
  return chatWithLocalOllama(prompt, options)
}

export async function huggingFaceChat(prompt, options = {}) {
  return chatWithHuggingFace(prompt, options)
}

/**
 * @param {string} prompt
 * @param {{ model?: string, temperature?: number, stream?: boolean }} options
 */
export async function ollamaChat(prompt, options = {}) {
  try {
    if (await isLocalOllamaAvailable()) {
      return await chatWithLocalOllama(prompt, options)
    }
  } catch (e) {
    // If local daemon fails, continue to HF fallback.
    if (!hasHuggingFace()) {
      return { ok: false, text: '', error: e.message ?? 'Ollama error', provider: 'ollama' }
    }
  }

  if (hasHuggingFace()) {
    try {
      return await chatWithHuggingFace(prompt, options)
    } catch (e) {
      return {
        ok: false,
        text: '',
        error: e.message ?? 'Hugging Face error',
        provider: 'huggingface',
      }
    }
  }

  return { ok: false, text: '', error: 'No LLM backend available', provider: 'none' }
}

export async function ollamaChatJson(prompt, options = {}) {
  const wrapped = `${prompt}\n\nRespond with valid JSON only, no markdown.`
  const res = await ollamaChat(wrapped, options)
  if (!res.ok) return res
  const match = res.text.match(/\{[\s\S]*\}/)
  if (!match) return { ...res, parsed: null }
  try {
    return { ...res, parsed: JSON.parse(match[0]) }
  } catch {
    return { ...res, parsed: null }
  }
}
