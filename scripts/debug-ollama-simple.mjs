import 'dotenv/config'
import { ollamaChat } from '../server/lib/llm/ollamaClient.mjs'

const tests = [
  'Say hi',
  'Return JSON only: {"summaryBn":"test"}',
  'Write one Bengali word for hello in Bangla script only',
]

for (const p of tests) {
  const t = Date.now()
  const r = await ollamaChat(p, { timeoutMs: 25_000, think: false })
  console.log(
    p.slice(0, 40).padEnd(42),
    `${Date.now() - t}ms`,
    r.ok ? 'OK' : 'FAIL',
    r.error ?? r.text?.slice(0, 60),
  )
}
