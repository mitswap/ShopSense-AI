/**
 * Inventory agent — stock, low stock, reorder signals.
 */
export function runInventoryAgent({ analytics, alerts, dataContext }) {
  const lines = []
  const low = analytics?.lowStockCount ?? 0
  const dead = analytics?.deadStockValue ?? 0

  lines.push(`Low-stock SKUs: ${low}`)
  lines.push(`Dead stock value: ${dead}`)

  const stockAlerts = (alerts ?? []).filter(
    (a) =>
      /stock|inventory|reorder|dead/i.test(`${a.title} ${a.message} ${a.type ?? ''}`),
  )
  for (const a of stockAlerts.slice(0, 5)) {
    lines.push(`Alert: ${a.title} — ${a.message}`)
  }

  if (dataContext?.products?.length) {
    const lowProducts = dataContext.products
      .filter((p) => (p.stock ?? p.quantity ?? 99) < 10)
      .slice(0, 8)
    for (const p of lowProducts) {
      lines.push(`SKU ${p.sku ?? p.name}: stock ${p.stock ?? p.quantity}`)
    }
  }

  return {
    agent: 'inventory',
    summary: lines.join('\n'),
    tools: ['stock_analysis', 'low_stock_detection', 'reorder_logic'],
  }
}
