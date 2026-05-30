import 'dotenv/config'
import { ollamaChat } from '../server/lib/llm/ollamaClient.mjs'

const full = `SME shop advisor (Bangladesh). CRITICAL: Write ALL user-facing text in Bengali (Bangla script only — বাংলা).

Shop: Rahim
30d revenue: 85000
SKUs: 40
Low stock: 5

Signals:
inventory: Low-stock SKUs: 5
Dead stock value: 0
sales: No sales anomalies in feed.
insight: No graph or critical alerts.

JSON only:
{"summaryBn":"2-3 sentences","recommendations":[{"titleBn":"","actionBn":"","priority":1,"reasonBn":""}]}`

const minimal = `Bengali JSON only for shop with revenue 85000, low stock 5:
{"summaryBn":"2 sentences","recommendations":[{"titleBn":"a","actionBn":"b","priority":1,"reasonBn":"c"}]}`

for (const [name, prompt] of [
  ['minimal', minimal],
  ['full', full],
]) {
  const t = Date.now()
  const r = await ollamaChat(prompt, { timeoutMs: 90_000, think: false, numPredict: 384 })
  console.log(
    name,
    prompt.length,
    `${Date.now() - t}ms`,
    r.ok ? 'OK' : 'FAIL',
    r.error ?? r.text?.slice(0, 120),
  )
}
