import { hasOpenRouter, hasLlm } from '../openrouter.mjs'
import {
  isOllamaAvailable,
  isLocalOllamaAvailable,
  hasHuggingFace,
  getOllamaModel,
  getOllamaReasonerModel,
} from '../lib/llm/ollamaClient.mjs'

export async function handleStatus(_req, res) {
  if (_req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const llmUp = await isOllamaAvailable()
  const localOllamaUp = await isLocalOllamaAvailable()
  const hfUp = hasHuggingFace()
  const orUp = hasOpenRouter()

  res.status(200).json({
    ok: true,
    layers: {
      frontend: { ready: true, label: 'React + Vite (Vercel)' },
      csvPipeline: { ready: true, label: 'Adaptive CSV ingest' },
      analytics: { ready: true, label: 'Analytics engine' },
      forecasting: { ready: true, label: 'Festival-aware forecast' },
      ollama: {
        ready: llmUp,
        label: localOllamaUp
          ? `Ollama ${getOllamaModel()}`
          : hfUp
            ? `HF cloud LLM (${getOllamaModel()})`
            : 'Ollama (local/Docker only)',
      },
      llama32: {
        ready: llmUp || orUp,
        label: llmUp ? getOllamaModel() : orUp ? 'OpenRouter cloud inference' : 'offline',
      },
      deepseekR1: {
        ready: llmUp || orUp,
        label: llmUp
          ? getOllamaReasonerModel()
          : orUp
            ? 'DeepSeek-class via OpenRouter'
            : 'offline',
      },
      huggingface: {
        ready: hfUp,
        label: 'Hugging Face Inference Providers',
        hint: hfUp ? null : 'Set HF_TOKEN',
      },
      openrouter: {
        ready: orUp,
        label: 'OpenRouter LLM + embeddings',
        hint: orUp ? null : 'Set OPENROUTER_API_KEY',
      },
      schemaAI: { ready: hasLlm(), label: 'LLM schema mapping' },
      deployment: { ready: true, label: process.env.RENDER ? 'Render API' : 'Vercel serverless API' },
    },
  })
}

export async function handleHealth(_req, res) {
  if (_req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const llmUp = await isOllamaAvailable()
  res.status(200).json({
    ok: true,
    openrouter: hasOpenRouter(),
    huggingface: hasHuggingFace(),
    ollama: llmUp,
    ollamaModel: getOllamaModel(),
    ollamaReasoner: getOllamaReasonerModel(),
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  })
}

export async function handleIntelligenceHealth(_req, res) {
  if (_req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const llmUp = await isOllamaAvailable()
  const localOllamaUp = await isLocalOllamaAvailable()
  res.status(200).json({
    ok: true,
    ollama: llmUp,
    ollamaModel: getOllamaModel(),
    ollamaReasonerModel: getOllamaReasonerModel(),
    openrouter: hasOpenRouter(),
    huggingface: hasHuggingFace(),
    agenticRag: true,
    reasoningMode: localOllamaUp ? 'ollama-local' : hasHuggingFace() ? 'huggingface-cloud' : 'openrouter-cloud',
  })
}