import type { Locale } from './i18n'
import {
  alertReorderSoon,
  alertSlowMover,
  alertStockout,
} from './localeCopy'
import type { Alert, ProductForecast } from '../types'

export function generateAlerts(forecasts: ProductForecast[], locale: Locale = 'en'): Alert[] {
  const alerts: Alert[] = []

  for (const f of forecasts) {
    if (f.daysUntilStockout !== null && f.daysUntilStockout <= 7) {
      alerts.push({
        id: `stockout-${f.sku}`,
        type: 'stockout',
        severity: 'high',
        sku: f.sku,
        messageBn: alertStockout(locale, f.name, f.daysUntilStockout, f.suggestedReorder),
      })
    } else if (f.daysUntilStockout !== null && f.daysUntilStockout <= 14) {
      alerts.push({
        id: `reorder-${f.sku}`,
        type: 'reorder',
        severity: 'medium',
        sku: f.sku,
        messageBn: alertReorderSoon(locale, f.name, f.suggestedReorder),
      })
    }

    if (f.currentStock > 0 && f.avgDailySales < 0.2 && f.currentStock > 50) {
      alerts.push({
        id: `overstock-${f.sku}`,
        type: 'overstock',
        severity: 'low',
        sku: f.sku,
        messageBn: alertSlowMover(locale, f.name, f.currentStock),
      })
    }
  }

  return alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.severity] - order[b.severity]
  })
}
