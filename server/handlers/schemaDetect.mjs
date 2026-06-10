import { ruleBasedMappings } from '../schema-rules.mjs'
import {
  buildReasoningEnvelope,
  runReasoningTask,
} from '../lib/intelligence/runtime.mjs'

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

function mergeWithDeterministicMappings(normalized, deterministicFallback, columns) {
  if (!normalized?.mappings?.length) return normalized

  const merged = [...normalized.mappings]
  const usedSources = new Set(merged.map((m) => m.sourceColumn))
  const usedFields = new Set(merged.map((m) => m.canonicalField))

  for (const fallback of deterministicFallback?.mappings ?? []) {
    if (usedSources.has(fallback.sourceColumn)) continue
    if (usedFields.has(fallback.canonicalField)) continue
    merged.push(fallback)
    usedSources.add(fallback.sourceColumn)
    usedFields.add(fallback.canonicalField)
  }

  return {
    mappings: merged,
    unmapped: columns.filter((c) => !usedSources.has(c)),
    method: normalized.method === 'llm' ? 'hybrid' : normalized.method,
  }
}

function buildSchemaPrompt(columns, sampleRows = []) {
  return `You are ShopSense AI performing grounded retail CSV schema mapping for Bangladesh clothing SMEs.
Map uploaded columns to canonical fields ONLY from this list:
date, product_name, category, quantity, unit_price, revenue, stock, unit_cost, weather, season, festival, location, branch, supplier

Use only the uploaded columns and sample rows.
Do not invent source columns or canonical fields outside the allowed list.

Uploaded columns: ${JSON.stringify(columns)}
Sample rows: ${JSON.stringify(sampleRows.slice(0, 3))}

Return valid JSON only:
{"mappings":[{"sourceColumn":"...","canonicalField":"...","confidence":0.95}],"unmapped":["..."],"confidence":0.86}`
}

export async function handleSchemaDetect(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { columns, sampleRows } = parseBody(req)
  if (!columns?.length) return res.status(400).json({ error: 'columns required' })

  const evidenceUsed = ['schema.columns', 'schema.sampleRows']
  const deterministicFallback = ruleBasedMappings(columns)

  try {
    const runtime = await runReasoningTask({
      taskType: 'schema_mapping',
      prompt: buildSchemaPrompt(columns, sampleRows ?? []),
      evidence: evidenceUsed,
      guards: {
        requiredArrayFields: ['mappings'],
      },
      fallback: () => ({
        provider: 'deterministic',
        parsed: deterministicFallback,
        confidence: 0.7,
        evidenceUsed,
      }),
      reasoningPath: ['task:schema_mapping'],
    })

    const normalized = mergeWithDeterministicMappings(
      parseMappingPayload(runtime.parsed, columns),
      deterministicFallback,
      columns,
    )
    if (normalized?.mappings?.length) {
      return res.status(200).json({
        ...normalized,
        ...buildReasoningEnvelope({
          provider: runtime.provider,
          reasoningPath: runtime.reasoningPath,
          evidenceUsed: runtime.evidenceUsed,
          confidence:
            normalized.method === 'llm'
              ? Number(runtime.parsed?.confidence ?? runtime.confidence ?? 0.84)
              : runtime.confidence,
          ragMode: 'none',
          validation: runtime.validation,
          attempts: runtime.attempts,
          fallbackDepth: runtime.fallbackDepth,
          latencyMs: runtime.latencyMs,
        }),
      })
    }
  } catch {
    /* rules fallback */
  }

  res.status(200).json({
    ...deterministicFallback,
    ...buildReasoningEnvelope({
      provider: 'deterministic',
      reasoningPath: ['task:schema_mapping', 'fallback:deterministic'],
      evidenceUsed,
      confidence: 0.7,
      ragMode: 'none',
      validation: { ok: true, errors: [] },
      attempts: [],
      fallbackDepth: 1,
      latencyMs: 0,
    }),
  })
}
