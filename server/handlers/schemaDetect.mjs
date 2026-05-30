import { ruleBasedMappings } from '../schema-rules.mjs'
import { generateText } from '../lib/llm/llmRouter.mjs'

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

function parseMappingPayload(raw, columns) {
  if (!raw) return null

  // Expected shape: { mappings: [{ sourceColumn, canonicalField, confidence }], unmapped: [] }
  if (Array.isArray(raw.mappings)) {
    const mappings = raw.mappings
      .filter((m) => m && typeof m.sourceColumn === 'string' && typeof m.canonicalField === 'string')
      .map((m) => ({
        sourceColumn: m.sourceColumn,
        canonicalField: m.canonicalField,
        confidence: Number(m.confidence ?? 0.8),
      }))

    if (!mappings.length) return null

    const mapped = new Set(mappings.map((m) => m.sourceColumn))
    return {
      mappings,
      unmapped: columns.filter((c) => !mapped.has(c)),
      method: 'llm',
    }
  }

  // Compatibility: {"sku":"sku","qty":"quantity"} -> convert to mapping list.
  const entries = Object.entries(raw).filter(
    ([k, v]) => k !== 'method' && typeof k === 'string' && typeof v === 'string',
  )
  if (!entries.length) return null
  const mappings = entries.map(([sourceColumn, canonicalField]) => ({
    sourceColumn,
    canonicalField,
    confidence: 0.75,
  }))
  const mapped = new Set(mappings.map((m) => m.sourceColumn))
  return {
    mappings,
    unmapped: columns.filter((c) => !mapped.has(c)),
    method: 'llm',
  }
}

export async function handleSchemaDetect(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { columns, sampleRows } = parseBody(req)
  if (!columns?.length) return res.status(400).json({ error: 'columns required' })

  try {
    const prompt = `You are a retail CSV schema mapper for Bangladesh clothing SMEs.
Map uploaded columns to canonical fields ONLY from this list:
date, product_name, category, quantity, unit_price, revenue, stock, unit_cost, weather, season, festival, location, branch, supplier

Uploaded columns: ${JSON.stringify(columns)}
Sample rows: ${JSON.stringify((sampleRows ?? []).slice(0, 3))}

Return JSON only:
{"mappings":[{"sourceColumn":"...","canonicalField":"...","confidence":0.95}],"unmapped":[]}`

    const gen = await generateText(prompt, { maxTokens: 512, json: true, timeoutMs: 20_000 })
    const text = gen?.text ?? ''
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      const parsed = JSON.parse(m[0])
      const normalized = parseMappingPayload(parsed, columns)
      if (normalized?.mappings?.length) {
        return res.status(200).json(normalized)
      }
    }
  } catch {
    /* rules fallback */
  }

  res.status(200).json(ruleBasedMappings(columns))
}
