import { runReasoningTask, buildReasoningEnvelope } from '../lib/intelligence/runtime.mjs'
import { parseWithOcrSpace } from '../lib/memo/ocrSpace.mjs'

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

function parseFlexibleDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(raw)
  if (iso) return raw.slice(0, 10)
  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(raw)
  if (dmy) {
    const [, a, b, y] = dmy
    const first = Number(a)
    const second = Number(b)
    if (first > 12) return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
    return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`
  }
  const parsed = Date.parse(raw)
  if (Number.isNaN(parsed)) return null
  return new Date(parsed).toISOString().slice(0, 10)
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

function parseJsonBlock(text) {
  if (!text?.trim()) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function extractHeaderFromText(text) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const dateMatch = lines
    .map((line) => parseFlexibleDate(line))
    .find(Boolean)

  const memoMatch = lines.find((line) => /memo|invoice|bill/i.test(line))
  return {
    supplier: lines[0] ?? '',
    memoNumber: memoMatch ?? '',
    memoDate: dateMatch ?? '',
  }
}

function deterministicMemoFallback(ocrText, existingProducts = []) {
  const header = extractHeaderFromText(ocrText)
  const normalizedProducts = existingProducts.map((product) => ({
    sku: product.sku,
    name: product.name,
    lowered: String(product.name ?? '').toLowerCase(),
  }))

  const rows = String(ocrText ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\s{2,}/g, ' '))
    .map((line, index) => {
      const match = line.match(/^(.+?)\s+(\d+)\s+(\d+(?:\.\d{1,2})?)(?:\s+\d+(?:\.\d{1,2})?)?$/)
      if (!match) return null
      const [, productName, qtyRaw, costRaw] = match
      const found = normalizedProducts.find((item) => item.lowered === productName.toLowerCase())
      const quantity = toNumber(qtyRaw)
      const unitCost = toNumber(costRaw)
      return {
        id: `memo-row-${index + 1}`,
        date: header.memoDate || new Date().toISOString().slice(0, 10),
        product_name: productName.trim(),
        category: 'General',
        quantity,
        unit_cost: unitCost,
        stock: quantity,
        supplier: header.supplier || '',
        confidence: 0.45,
        matchedSku: found?.sku ?? null,
        isNewProduct: !found,
        warnings: [],
      }
    })
    .filter(Boolean)

  return {
    header,
    rows,
    warnings: [],
  }
}

function buildMemoPrompt({ ocrText, fileName, existingProducts = [] }) {
  return `You are ShopSense AI extracting structured supplier memo rows for a clothing shop inventory system.
Use only the OCR text provided. Do not invent products or quantities.

Goal:
- Read an English supplier memo image/PDF OCR result
- Extract memo header fields if available
- Extract row items for inventory stock-in
- Match rows to existing product catalog when the product clearly matches

Rules:
- Supplier memo price is purchase cost, so output it as unit_cost
- quantity must be positive integer
- stock should equal quantity for each imported row
- If category is unknown, use "General"
- If date is missing on a row, use the memo date if available
- If you are unsure, keep the row but add a warning
- matchedSku must be null if no clear match exists
- isNewProduct must be true when matchedSku is null

Existing products:
${JSON.stringify(existingProducts.slice(0, 100).map((p) => ({ sku: p.sku, name: p.name, category: p.category })), null, 2)}

File name: ${fileName}
OCR text:
${ocrText}

Return valid JSON only:
{
  "header": {
    "supplier": "",
    "memoNumber": "",
    "memoDate": ""
  },
  "rows": [
    {
      "date": "YYYY-MM-DD",
      "product_name": "",
      "category": "General",
      "quantity": 12,
      "unit_cost": 1500,
      "stock": 12,
      "supplier": "",
      "confidence": 0.91,
      "matchedSku": null,
      "isNewProduct": true,
      "warnings": [{"field":"general","level":"warning","message":"..."}]
    }
  ],
  "warnings": [{"field":"general","level":"warning","message":"..."}]
}`
}

function normalizeWarnings(items = [], rowIndex = undefined) {
  if (!Array.isArray(items)) return []
  return items
    .map((warning) => ({
      rowIndex,
      field:
        warning?.field === 'date' ||
        warning?.field === 'product_name' ||
        warning?.field === 'quantity' ||
        warning?.field === 'unit_cost' ||
        warning?.field === 'supplier' ||
        warning?.field === 'memo_number'
          ? warning.field
          : 'general',
      level: warning?.level === 'error' ? 'error' : 'warning',
      message: String(warning?.message ?? '').trim(),
    }))
    .filter((warning) => warning.message)
}

function normalizeMemoRows(parsed = {}, existingProducts = []) {
  const today = new Date().toISOString().slice(0, 10)
  const existingBySku = new Map(existingProducts.map((product) => [product.sku, product]))
  const existingByName = new Map(
    existingProducts.map((product) => [String(product.name ?? '').toLowerCase(), product]),
  )

  const rows = Array.isArray(parsed.rows) ? parsed.rows : []
  const normalizedRows = []
  const warnings = [...normalizeWarnings(parsed.warnings)]

  rows.forEach((row, index) => {
    const productName = String(row?.product_name ?? '').trim()
    const matchedByName = existingByName.get(productName.toLowerCase())
    const matchedSku = row?.matchedSku && existingBySku.has(row.matchedSku)
      ? row.matchedSku
      : matchedByName?.sku ?? null
    const quantity = Math.max(0, Math.round(toNumber(row?.quantity)))
    const unitCost = Math.max(0, toNumber(row?.unit_cost))
    const normalizedDate = parseFlexibleDate(row?.date) ?? parseFlexibleDate(parsed.header?.memoDate) ?? today
    const rowWarnings = normalizeWarnings(row?.warnings, index)

    if (!productName) {
      warnings.push({
        rowIndex: index,
        field: 'product_name',
        level: 'error',
        message: 'Product name is missing',
      })
      return
    }
    if (quantity <= 0) {
      warnings.push({
        rowIndex: index,
        field: 'quantity',
        level: 'error',
        message: `Quantity for ${productName} must be positive`,
      })
    }
    if (unitCost <= 0) {
      warnings.push({
        rowIndex: index,
        field: 'unit_cost',
        level: 'warning',
        message: `Unit cost for ${productName} looks missing or invalid`,
      })
    }

    if (!matchedSku) {
      rowWarnings.push({
        rowIndex: index,
        field: 'general',
        level: 'warning',
        message: 'This product will be created as a new inventory row if confirmed.',
      })
    }

    normalizedRows.push({
      id: `memo-row-${index + 1}`,
      date: normalizedDate,
      product_name: productName,
      category: String(row?.category ?? matchedByName?.category ?? 'General').trim() || 'General',
      quantity,
      unit_cost: unitCost,
      stock: quantity,
      supplier: String(row?.supplier ?? parsed.header?.supplier ?? '').trim(),
      confidence: Number(row?.confidence ?? 0.65),
      matchedSku,
      isNewProduct: !matchedSku,
      warnings: rowWarnings,
    })
  })

  return {
    header: {
      supplier: String(parsed.header?.supplier ?? '').trim(),
      memoNumber: String(parsed.header?.memoNumber ?? '').trim(),
      memoDate: parseFlexibleDate(parsed.header?.memoDate) ?? '',
    },
    rows: normalizedRows,
    warnings,
  }
}

export async function handleMemoPreview(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = parseBody(req)
  const {
    fileName = 'memo',
    mimeType = '',
    dataUrl = '',
    existingProducts = [],
  } = body ?? {}

  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return res.status(400).json({ error: 'Memo image or PDF data is required' })
  }

  const estimatedBytes = Math.floor((dataUrl.split(',')[1]?.length ?? 0) * 0.75)
  if (estimatedBytes > 1024 * 1024) {
    return res.status(400).json({
      error: 'Your upload should stay within 1 MB for a reliable preview.',
    })
  }

  let ocr
  try {
    ocr = await parseWithOcrSpace({ dataUrl, mimeType, fileName })
  } catch (error) {
    return res.status(503).json({ error: error?.message ?? 'OCR failed' })
  }

  const evidenceUsed = ['memo.ocr.text', 'memo.catalog']
  const prompt = buildMemoPrompt({
    ocrText: ocr.text,
    fileName,
    existingProducts,
  })

  const runtime = await runReasoningTask({
    taskType: 'document_extract',
    prompt,
    evidence: evidenceUsed,
    guards: {
      requiredArrayFields: ['rows'],
    },
    fallback: () => ({
      provider: 'deterministic',
      parsed: deterministicMemoFallback(ocr.text, existingProducts),
      confidence: 0.58,
      evidenceUsed,
    }),
    reasoningPath: ['task:document_extract', 'source:memo'],
  })

  const parsed = runtime.parsed ?? parseJsonBlock(runtime.text) ?? deterministicMemoFallback(ocr.text, existingProducts)
  const normalized = normalizeMemoRows(parsed, existingProducts)

  return res.status(200).json({
    header: normalized.header,
    rows: normalized.rows,
    warnings: normalized.warnings,
    ocrEngine: ocr.engine,
    rawTextPreview: ocr.text.slice(0, 2400),
    ...buildReasoningEnvelope({
      provider: runtime.provider,
      reasoningPath: runtime.reasoningPath,
      evidenceUsed: runtime.evidenceUsed,
      confidence: runtime.confidence,
      ragMode: 'none',
      validation: runtime.validation,
      attempts: runtime.attempts,
      fallbackDepth: runtime.fallbackDepth,
      latencyMs: runtime.latencyMs,
    }),
  })
}
