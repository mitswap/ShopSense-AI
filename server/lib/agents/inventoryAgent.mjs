/**
 * Inventory agent — grounded stock and reorder evidence.
 */
export function runInventoryAgent({ analytics, alerts, dataContext }) {
  const lowStockCount = analytics?.lowStockCount ?? 0
  const deadStockCount = analytics?.deadStockCount ?? 0
  const deadStockValue = analytics?.deadStockValue ?? 0

  const stockAlerts = (alerts ?? [])
    .filter((a) => /stock|inventory|reorder|dead/i.test(`${a.type ?? ''} ${a.messageBn ?? ''}`))
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.messageBn,
      sku: a.sku,
    }))

  const lowProducts = (dataContext?.products ?? [])
    .map((p) => ({
      sku: p.sku ?? p.name,
      stock: p.stockQty ?? p.stock ?? p.quantity ?? 0,
      name: p.nameBn ?? p.name ?? p.sku,
    }))
    .filter((p) => p.stock < 10)
    .slice(0, 8)

  const summaryLines = [
    `Low-stock SKUs: ${lowStockCount}`,
    `Dead stock count: ${deadStockCount}`,
    `Dead stock value: ${deadStockValue}`,
    ...stockAlerts.map((a) => `Alert [${a.severity}] ${a.type}: ${a.message}`),
    ...lowProducts.map((p) => `Low stock product ${p.sku}: ${p.stock}`),
  ]

  return {
    agent: 'inventory',
    intentSupport: ['inventory', 'stock', 'reorder', 'dead_stock'],
    inputsNeeded: ['analytics.lowStockCount', 'analytics.deadStockCount', 'alerts', 'products'],
    evidence: {
      lowStockCount,
      deadStockCount,
      deadStockValue,
      stockAlerts,
      lowProducts,
    },
    summary: summaryLines.join('\n'),
    confidence: lowStockCount > 0 || stockAlerts.length > 0 ? 0.9 : 0.72,
    completeness: {
      hasAnalytics: Boolean(analytics),
      hasAlerts: Boolean((alerts ?? []).length),
      hasProducts: Boolean((dataContext?.products ?? []).length),
    },
    recommendedNextToolCalls: ['alert_triage', 'forecast_explainer'],
    tools: ['stock_analysis', 'low_stock_detection', 'reorder_logic'],
  }
}
