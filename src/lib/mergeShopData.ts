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

export function mergeShopData(existing: ShopData | null, incoming: ShopData): ShopData {
  if (!existing) return incoming

  const products = new Map<string, Product>()
  for (const p of existing.products) products.set(p.sku, p)
  for (const p of incoming.products) {
    const prev = products.get(p.sku)
    if (!prev || incoming.updatedAt >= existing.updatedAt) {
      products.set(p.sku, { ...p })
    } else {
      products.set(p.sku, { ...prev, stockQty: Math.max(prev.stockQty, p.stockQty) })
    }
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
