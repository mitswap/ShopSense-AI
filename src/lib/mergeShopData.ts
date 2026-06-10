import type { Product, SaleRecord, ShopData } from '../types'

function dedupeSales(sales: SaleRecord[]): SaleRecord[] {
  const seen = new Set<string>()
  const out: SaleRecord[] = []
  for (const sale of sales) {
    const key = `${sale.sku}|${sale.saleDate}|${sale.qtySold}|${sale.revenue}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(sale)
  }
  return out
}

function mergeFirstStockDate(prev?: string, next?: string): string | undefined {
  if (prev && next) return prev <= next ? prev : next
  return next ?? prev
}

export function mergeShopData(existing: ShopData | null, incoming: ShopData): ShopData {
  if (!existing) return incoming

  const products = new Map<string, Product>()
  for (const p of existing.products) products.set(p.sku, p)
  for (const p of incoming.products) {
    const prev = products.get(p.sku)
    if (!prev) {
      products.set(p.sku, p)
      continue
    }

    products.set(p.sku, {
      ...prev,
      name: p.name || prev.name,
      nameBn: p.nameBn || prev.nameBn,
      category: p.category || prev.category,
      stockQty: Math.max(0, prev.stockQty) + Math.max(0, p.stockQty),
      unitCost: p.unitCost > 0 ? p.unitCost : prev.unitCost,
      unitPrice: p.unitPrice > 0 ? p.unitPrice : prev.unitPrice,
      firstStockDate: mergeFirstStockDate(prev.firstStockDate, p.firstStockDate),
    })
  }

  const mergedSales = dedupeSales([...existing.sales, ...incoming.sales]).map((sale, index) => ({
    ...sale,
    id: `${sale.id}-${index}`,
  }))

  return {
    ...existing,
    products: Array.from(products.values()),
    sales: mergedSales,
    updatedAt: new Date().toISOString(),
    rowCount: (existing.rowCount ?? 0) + (incoming.rowCount ?? 0),
    schemaMappings: incoming.schemaMappings?.length
      ? incoming.schemaMappings
      : existing.schemaMappings,
  }
}
