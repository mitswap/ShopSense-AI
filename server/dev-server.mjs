import 'dotenv/config'
import {
  isOllamaAvailable,
  isLocalOllamaAvailable,
  hasHuggingFace,
  getOllamaModel,
  getOllamaReasonerModel,
} from './lib/llm/ollamaClient.mjs'
import { hasOpenRouter } from './openrouter.mjs'
import { app } from './app.mjs'
import { createClient } from '@supabase/supabase-js'

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

app.listen(PORT, async () => {
  const llmUp = await isOllamaAvailable()
  const localOllamaUp = await isLocalOllamaAvailable()
  console.log(`SME API server http://localhost:${PORT}`)
  console.log(`OpenRouter: ${hasOpenRouter()}`)
  console.log(`Hugging Face: ${hasHuggingFace()}`)
  console.log(`LLM backend: ${llmUp ? (localOllamaUp ? 'ollama-local' : 'huggingface-cloud') : 'offline'} (${getOllamaModel()})`)
  console.log(`Ollama reasoner: ${getOllamaReasonerModel()}`)
  console.log(`Supabase admin: ${Boolean(getSupabaseAdmin())}`)
  console.log(`Full status: http://localhost:${PORT}/api/status`)
})
