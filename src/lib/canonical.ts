import type { CanonicalField, CanonicalRow, ColumnMapping } from '../types'

export const CANONICAL_FIELDS: CanonicalField[] = [
  'date',
  'product_name',
  'category',
  'quantity',
  'unit_price',
  'revenue',
  'stock',
  'unit_cost',
  'weather',
  'season',
  'festival',
  'location',
  'branch',
  'supplier',
]

/** Rule-based synonym map — no hardcoded business data */
const SYNONYM_RULES: Record<CanonicalField, string[]> = {
  date: ['date', 'sale_date', 'sold_at', 'sold_date', 'transaction_date', 'তারিখ'],
  product_name: [
    'product',
    'product_name',
    'item',
    'item_name',
    'cloth_name',
    'name',
    'পণ্য',
    'পণ্যের_নাম',
  ],
  category: ['category', 'cat', 'type', 'product_type', 'ক্যাটাগরি'],
  quantity: ['quantity', 'qty', 'sold', 'pcs', 'pieces', 'units', 'qty_sold', 'quantity_sold'],
  unit_price: ['price', 'unit_price', 'rate', 'selling_price'],
  revenue: ['revenue', 'amount', 'total', 'sales', 'total_price', 'total_revenue'],
  stock: ['stock', 'stock_qty', 'inventory', 'on_hand', 'quantity_on_hand'],
  unit_cost: ['cost', 'unit_cost', 'purchase_price', 'cogs'],
  weather: ['weather', 'আবহাওয়া'],
  season: ['season', 'মৌসুম'],
  festival: ['festival', 'holiday', 'event', 'উৎসব'],
  location: ['location', 'branch', 'store', 'city', 'area', 'লোকেশন'],
  branch: ['branch', 'store_id', 'outlet'],
  supplier: ['supplier', 'vendor', 'সরবরাহকারী'],
}

function normalizeCol(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

export function detectSchemaMappings(columns: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = []
  const used = new Set<CanonicalField>()

  for (const col of columns) {
    const norm = normalizeCol(col)
    let best: { field: CanonicalField; score: number } | null = null

    for (const field of CANONICAL_FIELDS) {
      if (used.has(field)) continue
      const synonyms = SYNONYM_RULES[field]
      for (const syn of synonyms) {
        let score = 0
        if (norm === syn) score = 0.98
        else if (norm.includes(syn) || syn.includes(norm)) score = 0.85
        else if (norm.replace(/_/g, '') === syn.replace(/_/g, '')) score = 0.9
        if (score > (best?.score ?? 0)) best = { field, score }
      }
    }

    if (best && best.score >= 0.8) {
      mappings.push({
        sourceColumn: col,
        canonicalField: best.field,
        confidence: best.score,
      })
      used.add(best.field)
    }
  }

  return mappings
}

export function applyMappings(
  raw: Record<string, string>,
  mappings: ColumnMapping[],
): Partial<Record<CanonicalField, string>> {
  const out: Partial<Record<CanonicalField, string>> = {}
  const mapBySource = new Map(mappings.map((m) => [m.sourceColumn, m.canonicalField]))
  for (const [key, value] of Object.entries(raw)) {
    const field = mapBySource.get(key)
    if (field) out[field] = String(value ?? '').trim()
  }
  return out
}

export function parseFlexibleDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim()
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(s)
  if (iso) return s.slice(0, 10)

  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (mdy) {
    const [, m, d, y] = mdy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const parsed = Date.parse(s)
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10)
  }
  return null
}

function num(v: string | undefined, fallback = 0): number {
  if (v === undefined || v === '') return fallback
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

export function rowToCanonical(
  mapped: Partial<Record<CanonicalField, string>>,
): CanonicalRow | null {
  const product_name = mapped.product_name?.trim()
  if (!product_name) return null

  const dateRaw = mapped.date ?? ''
  const date = parseFlexibleDate(dateRaw) ?? dateRaw.slice(0, 10)
  if (!date) return null

  const quantity = num(mapped.quantity)
  const unit_price = num(mapped.unit_price)
  let revenue = num(mapped.revenue)
  if (revenue === 0 && quantity > 0 && unit_price > 0) revenue = quantity * unit_price

  const stock = num(mapped.stock)
  const unit_cost = num(mapped.unit_cost, unit_price > 0 ? unit_price * 0.65 : 0)

  return {
    date,
    product_name,
    category: mapped.category?.trim() || 'General',
    quantity,
    unit_price: unit_price || (quantity > 0 ? revenue / quantity : 0),
    revenue,
    stock,
    unit_cost,
    weather: mapped.weather,
    season: mapped.season,
    festival: mapped.festival,
    location: mapped.location ?? mapped.branch,
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
