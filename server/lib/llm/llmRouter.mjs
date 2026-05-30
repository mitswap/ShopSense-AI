import { chatCompletion, hasOpenRouter } from '../../openrouter.mjs'
import {
  isOllamaAvailable,
  ollamaChat,
  getOllamaModel,
} from './ollamaClient.mjs'

const FAST_TIMEOUT = Number(process.env.OLLAMA_FAST_TIMEOUT_MS ?? 30_000)

function allowOpenRouterFallback() {
  if (process.env.OLLAMA_OPENROUTER_FALLBACK === 'true') return true
  // On Render without local Ollama/HF, use OpenRouter so cloud inference still works.
  if (process.env.RENDER && process.env.OPENROUTER_API_KEY) return true
  return false
}

/**
 * Local Ollama first, then HF cloud fallback (inside ollamaChat), then OpenRouter if enabled.
 */
export async function generateText(prompt, options = {}) {
  const timeoutMs = options.timeoutMs ?? FAST_TIMEOUT

  if (await isOllamaAvailable()) {
    const model = getOllamaModel()
    const result = await ollamaChat(prompt, {
      model,
      timeoutMs,
      temperature: options.temperature ?? 0.25,
      think: false,
      numPredict: options.maxTokens ?? 384,
      format: options.json ? 'json' : undefined,
    })
    if (result.ok && result.text) {
      return {
        text: result.text,
        provider: result.provider ?? 'ollama',
        model: result.model ?? model,
      }
    }
  }

  if (allowOpenRouterFallback() && hasOpenRouter()) {
    try {
      const text = await chatCompletion(prompt, {
        temperature: options.temperature ?? 0.35,
        maxTokens: options.maxTokens ?? 1024,
      })
      return { text, provider: 'openrouter' }
    } catch (e) {
      return { text: '', provider: 'none', error: e.message }
    }
  }

  return {
    text: '',
    provider: 'none',
    error: 'No LLM backend ready. Configure local Ollama, HF_TOKEN, or OpenRouter fallback.',
  }
}