const SYNONYM_RULES = {
  date: ['date', 'sale_date', 'sold_at', 'sold_date'],
  product_name: ['product', 'product_name', 'item', 'item_name', 'cloth_name', 'name'],
  category: ['category', 'cat', 'type'],
  quantity: ['quantity', 'qty', 'sold', 'pcs', 'pieces'],
  unit_price: ['price', 'unit_price', 'rate'],
  revenue: ['revenue', 'amount', 'total'],
  stock: ['stock', 'stock_qty', 'inventory'],
  unit_cost: ['cost', 'unit_cost'],
  weather: ['weather'],
  season: ['season'],
  festival: ['festival', 'holiday'],
  location: ['location', 'branch', 'city'],
  branch: ['branch'],
  supplier: ['supplier', 'vendor'],
}

export function ruleBasedMappings(columns) {
  const mappings = []
  const used = new Set()
  for (const col of columns) {
    const norm = col.trim().toLowerCase().replace(/\s+/g, '_')
    let best = null
    for (const [field, syns] of Object.entries(SYNONYM_RULES)) {
      if (used.has(field)) continue
      for (const syn of syns) {
        let score = 0
        if (norm === syn) score = 0.98
        else if (norm.includes(syn)) score = 0.85
        if (score > (best?.score ?? 0)) best = { field, score }
      }
    }
    if (best && best.score >= 0.8) {
      mappings.push({ sourceColumn: col, canonicalField: best.field, confidence: best.score })
      used.add(best.field)
    }
  }
  const mappedCols = new Set(mappings.map((m) => m.sourceColumn))
  return {
    mappings,
    unmapped: columns.filter((c) => !mappedCols.has(c)),
    method: 'rules',
  }
}
