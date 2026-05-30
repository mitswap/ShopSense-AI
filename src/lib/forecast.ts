import { addDays, format, subDays } from 'date-fns'
import type { Product, ProductForecast, SaleRecord } from '../types'

/** Bangladesh festival uplift multipliers (approximate) */
function festivalMultiplier(date: Date): number {
  const m = date.getMonth() + 1
  const d = date.getDate()
  // Eid window (approx Apr & variable — use Apr-May + pre-Eid)
  if (m === 4 || (m === 5 && d <= 15)) return 1.35
  if (m === 10 || m === 11) return 1.2 // Puja / winter start
  if (m >= 6 && m <= 9) return 0.9 // monsoon dampener
  return 1
}

function movingAverage(values: number[], window = 7): number {
  if (values.length === 0) return 0
  const slice = values.slice(-window)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

function dailySalesSeries(sku: string, sales: SaleRecord[], days = 60): number[] {
  const end = new Date()
  const series: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = format(subDays(end, i), 'yyyy-MM-dd')
    const daySales = sales
      .filter((s) => s.sku === sku && s.saleDate.startsWith(day))
      .reduce((sum, s) => sum + s.qtySold, 0)
    series.push(daySales)
  }
  return series
}

function productFestivalBoost(sku: string, sales: SaleRecord[]): number {
  const fest = sales.filter((s) => s.sku === sku && s.festival && s.festival !== 'None')
  const normal = sales.filter((s) => s.sku === sku && (!s.festival || s.festival === 'None'))
  if (fest.length < 3 || normal.length < 3) return 1
  const festAvg = fest.reduce((a, s) => a + s.qtySold, 0) / fest.length
  const normAvg = normal.reduce((a, s) => a + s.qtySold, 0) / normal.length
  if (normAvg > 0 && festAvg / normAvg > 1.2) return 1.15
  return 1
}

export function forecastProducts(products: Product[], sales: SaleRecord[]): ProductForecast[] {
  return products.map((p) => {
    const seriesRaw = dailySalesSeries(p.sku, sales)
    const avg = movingAverage(seriesRaw, 14)
    const trend =
      movingAverage(seriesRaw.slice(-7), 7) - movingAverage(seriesRaw.slice(-14, -7), 7)
    const baseDaily = Math.max(avg + trend * 0.3, 0.05)

    const today = new Date()
    const mult = festivalMultiplier(today) * productFestivalBoost(p.sku, sales)
    const adjustedDaily = baseDaily * mult

    const forecast7d = adjustedDaily * 7
    const forecast30d = adjustedDaily * 30
    const daysUntilStockout =
      adjustedDaily > 0 ? Math.round(p.stockQty / adjustedDaily) : null

    let risk: ProductForecast['risk'] = 'low'
    if (daysUntilStockout !== null && daysUntilStockout < 7) risk = 'high'
    else if (daysUntilStockout !== null && daysUntilStockout < 14) risk = 'medium'

    const safety = adjustedDaily * 5
    const suggestedReorder = Math.max(
      0,
      Math.ceil(forecast14d(adjustedDaily) + safety - p.stockQty),
    )

    const series: ProductForecast['series'] = []
    for (let i = 1; i <= 14; i++) {
      const d = addDays(today, i)
      series.push({
        date: format(d, 'yyyy-MM-dd'),
        predicted: adjustedDaily * festivalMultiplier(d),
      })
    }

    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      nameBn: p.nameBn,
      currentStock: p.stockQty,
      avgDailySales: Number(adjustedDaily.toFixed(2)),
      forecast7d: Number(forecast7d.toFixed(1)),
      forecast30d: Number(forecast30d.toFixed(1)),
      daysUntilStockout,
      suggestedReorder,
      risk,
      series,
    }
  })
}

function forecast14d(daily: number): number {
  return daily * 14
}
