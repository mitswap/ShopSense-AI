import { getDay, parseISO, subDays } from 'date-fns'
import type { Locale } from './i18n'
import { weekdayName } from './localeCopy'
import type { AnalyticsSummary, Product, SaleRecord } from '../types'

export function computeAnalytics(
  products: Product[],
  sales: SaleRecord[],
  locale: Locale = 'en',
): AnalyticsSummary {
  const now = new Date()
  const cutoff30 = subDays(now, 30)
  const cutoff60 = subDays(now, 60)

  const parseSaleDate = (s: string) => {
    try {
      return parseISO(s.length === 10 ? s : s.slice(0, 10))
    } catch {
      return null
    }
  }

  const sales30 = sales.filter((s) => {
    const d = parseSaleDate(s.saleDate)
    return d && d >= cutoff30
  })
  const salesPrev30 = sales.filter((s) => {
    const d = parseSaleDate(s.saleDate)
    return d && d >= cutoff60 && d < cutoff30
  })

  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0)
  const totalRevenue30d = sales30.reduce((sum, s) => sum + s.revenue, 0)
  const prevRevenue = salesPrev30.reduce((sum, s) => sum + s.revenue, 0)
  const monthlyGrowthPct =
    prevRevenue > 0 ? ((totalRevenue30d - prevRevenue) / prevRevenue) * 100 : null

  const profitEstimate = sales.reduce((sum, s) => {
    const p = products.find((x) => x.sku === s.sku)
    const cost = (p?.unitCost ?? s.unitPrice * 0.65) * s.qtySold
    return sum + (s.revenue - cost)
  }, 0)

  const revenueBySku = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const s of sales) {
    const cur = revenueBySku.get(s.sku) ?? {
      name: products.find((p) => p.sku === s.sku)?.name ?? s.sku,
      qty: 0,
      revenue: 0,
    }
    cur.qty += s.qtySold
    cur.revenue += s.revenue
    revenueBySku.set(s.sku, cur)
  }

  const movers = [...revenueBySku.entries()]
    .map(([sku, v]) => ({ sku, name: v.name, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  const bestSeller = movers[0] ? { name: movers[0].name, revenue: movers[0].revenue } : null

  const qty30BySku = new Map<string, number>()
  for (const s of sales30) {
    qty30BySku.set(s.sku, (qty30BySku.get(s.sku) ?? 0) + s.qtySold)
  }

  let lowStockCount = 0
  let overstockCount = 0
  let deadStockCount = 0

  for (const p of products) {
    const avgDaily = (qty30BySku.get(p.sku) ?? 0) / 30
    const daysCover = p.stockQty / Math.max(avgDaily, 0.01)
    if (daysCover < 14) lowStockCount++
    if (daysCover > 90 && avgDaily < 0.3) overstockCount++
    if (avgDaily < 0.1 && p.stockQty > 30) deadStockCount++
  }

  const catMap = new Map<string, { stockValue: number; revenue: number; count: number }>()
  for (const p of products) {
    const cur = catMap.get(p.category) ?? { stockValue: 0, revenue: 0, count: 0 }
    cur.stockValue += p.stockQty * p.unitCost
    cur.count += 1
    catMap.set(p.category, cur)
  }
  for (const s of sales) {
    const p = products.find((x) => x.sku === s.sku)
    if (p && catMap.has(p.category)) {
      const cur = catMap.get(p.category)!
      cur.revenue += s.revenue
    }
  }

  const baselineRev =
    totalRevenue / Math.max(1, new Set(sales.map((s) => s.festival ?? 'None')).size)
  const festivalRev = new Map<string, number>()
  for (const s of sales) {
    const f = s.festival?.trim() || 'None'
    if (f === 'None') continue
    festivalRev.set(f, (festivalRev.get(f) ?? 0) + s.revenue)
  }
  const festivalLift = [...festivalRev.entries()]
    .map(([festival, revenue]) => ({
      festival,
      revenue,
      upliftPct: baselineRev > 0 ? ((revenue / baselineRev) - 1) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  const locRev = new Map<string, number>()
  for (const s of sales) {
    if (!s.location) continue
    locRev.set(s.location, (locRev.get(s.location) ?? 0) + s.revenue)
  }
  const locationPerformance = [...locRev.entries()]
    .map(([location, revenue]) => ({ location, revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  const dayRev = new Map<number, { total: number; count: number }>()
  for (const s of sales) {
    const d = parseSaleDate(s.saleDate)
    if (!d) continue
    const dow = getDay(d)
    const cur = dayRev.get(dow) ?? { total: 0, count: 0 }
    cur.total += s.revenue
    cur.count += 1
    dayRev.set(dow, cur)
  }
  const weekdayPattern = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    day: weekdayName(i, locale),
    avgRevenue: dayRev.get(i) ? dayRev.get(i)!.total / Math.max(dayRev.get(i)!.count, 1) : 0,
  }))

  const totalStockValue = products.reduce((sum, p) => sum + p.stockQty * p.unitCost, 0)

  return {
    totalStockValue,
    totalSkus: products.length,
    lowStockCount,
    overstockCount,
    deadStockCount,
    totalRevenue,
    totalRevenue30d,
    monthlyGrowthPct,
    profitEstimate,
    bestSeller,
    topMovers: movers.slice(0, 5).map((m) => ({ sku: m.sku, name: m.name, qty: m.qty })),
    slowMovers: [...movers].reverse().slice(0, 5).map((m) => ({ sku: m.sku, name: m.name, qty: m.qty })),
    categoryBreakdown: [...catMap.entries()].map(([category, v]) => ({
      category,
      stockValue: v.stockValue,
      revenue: v.revenue,
      count: v.count,
    })),
    festivalLift,
    locationPerformance,
    weekdayPattern,
  }
}

export function salesByDay(sales: SaleRecord[]) {
  const map = new Map<string, { qty: number; revenue: number }>()
  for (const s of sales) {
    const d = s.saleDate.slice(0, 10)
    const cur = map.get(d) ?? { qty: 0, revenue: 0 }
    cur.qty += s.qtySold
    cur.revenue += s.revenue
    map.set(d, cur)
  }
  return [...map.entries()]
    .map(([date, v]) => ({ date, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function productSalesTrend(
  productName: string,
  sales: SaleRecord[],
): { period: string; revenue: number; qty: number }[] {
  const sku = sales.find((s) =>
    s.sku.includes(productName.toLowerCase().replace(/\s+/g, '-')),
  )?.sku
  const filtered = sku
    ? sales.filter((s) => s.sku === sku)
    : sales.filter((s) => s.sku.toLowerCase().includes(productName.toLowerCase().slice(0, 4)))

  const byMonth = new Map<string, { revenue: number; qty: number }>()
  for (const s of filtered) {
    const period = s.saleDate.slice(0, 7)
    const cur = byMonth.get(period) ?? { revenue: 0, qty: 0 }
    cur.revenue += s.revenue
    cur.qty += s.qtySold
    byMonth.set(period, cur)
  }
  return [...byMonth.entries()]
    .map(([period, v]) => ({ period, ...v }))
    .sort((a, b) => a.period.localeCompare(b.period))
}
