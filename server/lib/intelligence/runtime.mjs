import {
  chatCompletionWithMeta,
  hasOpenRouter,
} from '../../openrouter.mjs'
import {
  hasHuggingFace,
  huggingFaceChat,
  isLocalOllamaAvailable,
  localOllamaChat,
} from './llm/ollamaClient.mjs'

const TASK_CONFIG = {
  chat_answer: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 260,
    temperature: 0.2,
    timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS ?? process.env.OLLAMA_NL_ENRICH_MS ?? 8_000),
    json: true,
  },
  owner_advice: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 520,
    temperature: 0.15,
    timeoutMs: Number(process.env.AI_ADVICE_TIMEOUT_MS ?? process.env.OLLAMA_INSIGHT_ENRICH_MS ?? 10_000),
    json: true,
  },
  root_cause: {
    preferredProviders: ['openrouter', 'huggingface'],
    maxTokens: 420,
    temperature: 0.15,
    timeoutMs: Number(process.env.AI_ROOT_CAUSE_TIMEOUT_MS ?? process.env.OLLAMA_NL_ENRICH_MS ?? 8_000),
    json: true,
  },
  graph_explainer: {
    preferredProviders: ['openrouter', 'huggingface'],
    maxTokens: 360,
    temperature: 0.15,
    timeoutMs: Number(process.env.AI_GRAPH_TIMEOUT_MS ?? 9_000),
    json: true,
  },
  alert_triage: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 320,
    temperature: 0.1,
    timeoutMs: Number(process.env.AI_ALERT_TIMEOUT_MS ?? 8_000),
    json: true,
  },
  forecast_explainer: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 320,
    temperature: 0.1,
    timeoutMs: Number(process.env.AI_FORECAST_TIMEOUT_MS ?? 8_000),
    json: true,
  },
  weather_reasoning: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 420,
    temperature: 0.15,
    timeoutMs: Number(process.env.AI_WEATHER_TIMEOUT_MS ?? 8_000),
    json: true,
  },
  schema_mapping: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 640,
    temperature: 0.05,
    timeoutMs: Number(process.env.AI_SCHEMA_TIMEOUT_MS ?? 20_000),
    json: true,
  },
  document_extract: {
    preferredProviders: ['openrouter', 'huggingface'],
    maxTokens: 900,
    temperature: 0.05,
    timeoutMs: Number(process.env.AI_DOCUMENT_EXTRACT_TIMEOUT_MS ?? 20_000),
    json: true,
  },
  translation: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 600,
    temperature: 0.05,
    timeoutMs: Number(process.env.OLLAMA_TRANSLATE_TIMEOUT_MS ?? 12_000),
    json: false,
  },
  retrieval_rerank: {
    preferredProviders: ['huggingface', 'openrouter'],
    maxTokens: 260,
    temperature: 0.05,
    timeoutMs: Number(process.env.AI_RERANK_TIMEOUT_MS ?? 8_000),
    json: true,
  },
}

function normalizeJsonPayload(text) {
  if (!text?.trim()) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function providerReady(provider) {
  if (provider === 'huggingface') return hasHuggingFace()
  if (provider === 'openrouter') return hasOpenRouter()
  if (provider === 'ollama') return false
  return false
}

async function executeViaProvider(provider, prompt, options, taskType) {
  if (provider === 'huggingface') {
    const res = await huggingFaceChat(prompt, {
      taskType,
      temperature: options.temperature,
      timeoutMs: options.timeoutMs,
      maxTokens: options.maxTokens,
      numPredict: options.maxTokens,
      format: options.json ? 'json' : undefined,
    })
    return {
      ok: Boolean(res.ok && res.text),
      provider: 'huggingface',
      model: res.model ?? null,
      text: res.text ?? '',
      error: res.error ?? null,
    }
  }

  if (provider === 'openrouter') {
    try {
      const result = await chatCompletionWithMeta(prompt, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })
      return {
        ok: Boolean(result.text?.trim()),
        provider: 'openrouter',
        model: result.model ?? null,
        text: result.text ?? '',
        error: null,
      }
    } catch (error) {
      return {
        ok: false,
        provider: 'openrouter',
        model: null,
        text: '',
        error: error?.message ?? 'OpenRouter error',
      }
    }
  }

  if (provider === 'ollama') {
    const localReady = await isLocalOllamaAvailable()
    if (!localReady) {
      return {
        ok: false,
        provider: 'ollama',
        model: null,
        text: '',
        error: 'Local Ollama unavailable',
      }
    }
    const res = await localOllamaChat(prompt, {
      temperature: options.temperature,
      timeoutMs: options.timeoutMs,
      numPredict: options.maxTokens,
      format: options.json ? 'json' : undefined,
    })
    return {
      ok: Boolean(res.ok && res.text),
      provider: 'ollama',
      model: res.model ?? null,
      text: res.text ?? '',
      error: res.error ?? null,
    }
  }

  return {
    ok: false,
    provider,
    model: null,
    text: '',
    error: `Unsupported provider: ${provider}`,
  }
}

function validateTaskOutput(taskType, parsed, guards = {}) {
  const errors = []
  if (guards.requireJson && !parsed) {
    errors.push('Missing JSON payload')
  }

  if (guards.requiredArrayFields?.length) {
    for (const field of guards.requiredArrayFields) {
      if (!Array.isArray(parsed?.[field])) errors.push(`Missing array field: ${field}`)
    }
  }

  if (guards.requiredStringFields?.length) {
    for (const field of guards.requiredStringFields) {
      if (typeof parsed?.[field] !== 'string' || !parsed[field].trim()) {
        errors.push(`Missing string field: ${field}`)
      }
    }
  }

  if (guards.locale === 'bn') {
    for (const field of guards.bengaliFields ?? []) {
      if (typeof parsed?.[field] === 'string' && /[A-Za-z]{4,}/.test(parsed[field])) {
        errors.push(`Field not localized enough: ${field}`)
      }
    }
  }

  if (taskType === 'schema_mapping' && parsed?.mappings && !Array.isArray(parsed.mappings)) {
    errors.push('Schema mappings must be an array')
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export async function runReasoningTask({
  taskType,
  prompt,
  evidence = [],
  guards = {},
  fallback = null,
  providerPolicy,
  reasoningPath = [],
}) {
  const startedAt = Date.now()
  const config = TASK_CONFIG[taskType] ?? TASK_CONFIG.chat_answer
  const preferredProviders = providerPolicy?.preferredProviders?.length
    ? providerPolicy.preferredProviders
    : config.preferredProviders

  const attempts = []

  for (const provider of preferredProviders) {
    if (!providerReady(provider)) continue
    const result = await executeViaProvider(provider, prompt, config, taskType)
    const parsed = config.json ? normalizeJsonPayload(result.text) : null
    const validation = validateTaskOutput(taskType, parsed, {
      requireJson: config.json,
      ...guards,
    })

    attempts.push({
      provider,
      model: result.model,
      ok: result.ok,
      error: result.error,
      validation,
    })

    if (result.ok && (!config.json || validation.ok)) {
      return {
        ok: true,
        provider,
        model: result.model,
        text: result.text,
        parsed,
        validation,
        confidence: provider === 'openrouter' ? 0.9 : 0.84,
        reasoningPath: [...reasoningPath, `provider:${provider}`, `task:${taskType}`],
        evidenceUsed: evidence,
        attempts,
        fallbackDepth: 0,
        latencyMs: Date.now() - startedAt,
      }
    }
  }

  const fallbackResult =
    typeof fallback === 'function'
      ? await fallback({
          attempts,
          reasoningPath: [...reasoningPath, 'fallback:deterministic'],
          evidenceUsed: evidence,
          latencyMs: Date.now() - startedAt,
        })
      : null

  if (fallbackResult) {
    return {
      ok: true,
      provider: fallbackResult.provider ?? 'deterministic',
      model: null,
      text: fallbackResult.text ?? '',
      parsed: fallbackResult.parsed ?? null,
      validation: { ok: true, errors: [] },
      confidence: fallbackResult.confidence ?? 0.72,
      reasoningPath: fallbackResult.reasoningPath ?? [...reasoningPath, 'fallback:deterministic'],
      evidenceUsed: fallbackResult.evidenceUsed ?? evidence,
      attempts,
      fallbackDepth: 1,
      latencyMs: Date.now() - startedAt,
    }
  }

  return {
    ok: false,
    provider: 'none',
    model: null,
    text: '',
    parsed: null,
    validation: {
      ok: false,
      errors: attempts.flatMap((a) => a.validation?.errors ?? []).filter(Boolean),
    },
    confidence: 0,
    reasoningPath: [...reasoningPath, 'failed'],
    evidenceUsed: evidence,
    attempts,
    fallbackDepth: attempts.length,
    latencyMs: Date.now() - startedAt,
  }
}

export function buildReasoningEnvelope(base = {}) {
  return {
    provider: base.provider ?? 'deterministic',
    method: base.provider ?? 'deterministic',
    reasoningPath: base.reasoningPath ?? [],
    evidenceUsed: base.evidenceUsed ?? [],
    confidence: base.confidence ?? 0,
    ragMode: base.ragMode,
    validation: base.validation ?? { ok: true, errors: [] },
    attempts: base.attempts ?? [],
    fallbackDepth: base.fallbackDepth ?? 0,
    latencyMs: base.latencyMs ?? 0,
  }
}
