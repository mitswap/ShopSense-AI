import { differenceInCalendarDays, getDay, parseISO, subDays } from 'date-fns'
import type { Locale } from './i18n-types'
import { weekdayName } from './localeCopy'
import type { AnalyticsSummary, Product, SaleRecord } from '../types'
import { findFestivalWindowByDate } from './festivalCalendar'

const SLOW_MOVER_MIN_AGE_DAYS = 30
const DEAD_STOCK_MIN_AGE_DAYS = 90
const SLOW_MOVER_MIN_STOCK = 12
const DEAD_STOCK_MIN_STOCK = 20

function safeParseDate(value?: string | null): Date | null {
  if (!value) return null
  try {
    return parseISO(value.length === 10 ? value : value.slice(0, 10))
  } catch {
    return null
  }
}

export function computeAnalytics(
  products: Product[],
  sales: SaleRecord[],
  locale: Locale = 'en',
): AnalyticsSummary {
  const now = new Date()
  const cutoff30 = subDays(now, 30)
  const cutoff60 = subDays(now, 60)

  const parseSaleDate = (s: string) => safeParseDate(s)

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
  const qty60BySku = new Map<string, number>()
  const lastSaleDateBySku = new Map<string, string>()
  const earliestSaleDateBySku = new Map<string, string>()
  for (const s of sales30) {
    qty30BySku.set(s.sku, (qty30BySku.get(s.sku) ?? 0) + s.qtySold)
  }
  for (const s of salesPrev30) {
    qty60BySku.set(s.sku, (qty60BySku.get(s.sku) ?? 0) + s.qtySold)
  }
  for (const s of sales30) {
    qty60BySku.set(s.sku, (qty60BySku.get(s.sku) ?? 0) + s.qtySold)
  }
  for (const s of sales) {
    const last = lastSaleDateBySku.get(s.sku)
    if (!last || s.saleDate > last) lastSaleDateBySku.set(s.sku, s.saleDate)
    const first = earliestSaleDateBySku.get(s.sku)
    if (!first || s.saleDate < first) earliestSaleDateBySku.set(s.sku, s.saleDate)
  }

  let lowStockCount = 0
  let overstockCount = 0
  let deadStockCount = 0
  const slowMoverCandidates: { sku: string; name: string; qty: number; severity: number }[] = []
  const deadStockCandidates: { sku: string; name: string; qty: number; severity: number }[] = []

  for (const p of products) {
    const avgDaily = (qty30BySku.get(p.sku) ?? 0) / 30
    const daysCover = p.stockQty / Math.max(avgDaily, 0.01)
    if (daysCover < 14) lowStockCount++
    if (daysCover > 90 && avgDaily < 0.3) overstockCount++

    const cycleStartRaw = p.firstStockDate ?? earliestSaleDateBySku.get(p.sku)
    const cycleStart = safeParseDate(cycleStartRaw)
    const cycleAgeDays = cycleStart ? Math.max(1, differenceInCalendarDays(now, cycleStart) + 1) : 0
    const qty30 = qty30BySku.get(p.sku) ?? 0
    const qty60 = qty60BySku.get(p.sku) ?? 0
    const qtyCycle = sales.reduce((sum, s) => {
      if (s.sku !== p.sku) return sum
      if (cycleStartRaw && s.saleDate < cycleStartRaw) return sum
      return sum + s.qtySold
    }, 0)
    const sellThroughPct =
      qtyCycle + p.stockQty > 0 ? (qtyCycle / (qtyCycle + p.stockQty)) * 100 : 0
    const lastSaleDate = safeParseDate(lastSaleDateBySku.get(p.sku))
    const daysSinceLastSale = lastSaleDate
      ? Math.max(0, differenceInCalendarDays(now, lastSaleDate))
      : cycleAgeDays
    const recentAvgDaily = qty30 / Math.max(Math.min(30, cycleAgeDays || 30), 1)

    const isDeadStock =
      cycleAgeDays >= DEAD_STOCK_MIN_AGE_DAYS &&
      p.stockQty >= DEAD_STOCK_MIN_STOCK &&
      qty30 <= 1 &&
      qty60 <= 3 &&
      daysSinceLastSale >= 21 &&
      sellThroughPct < 20

    if (isDeadStock) {
      deadStockCount++
      deadStockCandidates.push({
        sku: p.sku,
        name: p.name,
        qty: p.stockQty,
        severity: p.stockQty * Math.max(1, cycleAgeDays / 30),
      })
      continue
    }

    const isSlowMover =
      cycleAgeDays >= SLOW_MOVER_MIN_AGE_DAYS &&
      p.stockQty >= SLOW_MOVER_MIN_STOCK &&
      qty30 <= 2 &&
      recentAvgDaily < 0.15 &&
      daysSinceLastSale >= 10 &&
      sellThroughPct < 35

    if (isSlowMover) {
      slowMoverCandidates.push({
        sku: p.sku,
        name: p.name,
        qty: p.stockQty,
        severity: p.stockQty * Math.max(1, cycleAgeDays / 45),
      })
    }
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

  const productBySku = new Map(products.map((p) => [p.sku, p]))
  const nonFestivalByDay = new Map<string, number>()
  const productNormalStats = new Map<string, { qty: number; days: Set<string> }>()
  const festivalStats = new Map<
    string,
    {
      revenue: number
      qty: number
      days: Set<string>
      windowKeys: Set<string>
      bySku: Map<string, { name: string; qty: number; revenue: number; windows: Set<string> }>
    }
  >()

  for (const s of sales) {
    const festival = s.festival?.trim() || 'None'
    if (festival === 'None') {
      nonFestivalByDay.set(s.saleDate, (nonFestivalByDay.get(s.saleDate) ?? 0) + s.revenue)
      const normal =
        productNormalStats.get(s.sku) ??
        {
          qty: 0,
          days: new Set<string>(),
        }
      normal.qty += s.qtySold
      normal.days.add(s.saleDate)
      productNormalStats.set(s.sku, normal)
      continue
    }

    const window = findFestivalWindowByDate(s.saleDate)
    const stat =
      festivalStats.get(festival) ??
      {
        revenue: 0,
        qty: 0,
        days: new Set<string>(),
        windowKeys: new Set<string>(),
        bySku: new Map<string, { name: string; qty: number; revenue: number; windows: Set<string> }>(),
      }

    stat.revenue += s.revenue
    stat.qty += s.qtySold
    stat.days.add(s.saleDate)
    if (window) stat.windowKeys.add(window.key)

    const existingSku =
      stat.bySku.get(s.sku) ??
      {
        name: productBySku.get(s.sku)?.name ?? s.sku,
        qty: 0,
        revenue: 0,
        windows: new Set<string>(),
      }
    existingSku.qty += s.qtySold
    existingSku.revenue += s.revenue
    if (window) existingSku.windows.add(window.key)
    stat.bySku.set(s.sku, existingSku)

    festivalStats.set(festival, stat)
  }

  const nonFestivalDailyAvg =
    nonFestivalByDay.size > 0
      ? [...nonFestivalByDay.values()].reduce((sum, value) => sum + value, 0) / nonFestivalByDay.size
      : 0

  const festivalSummary = [...festivalStats.entries()]
    .map(([festival, stat]) => {
      const topProducts = [...stat.bySku.entries()]
        .map(([sku, value]) => {
          const currentStock = productBySku.get(sku)?.stockQty ?? 0
          const observedWindows = Math.max(1, value.windows.size)
          const avgFestivalWindowQty = value.qty / observedWindows
          const normal = productNormalStats.get(sku)
          const normalDailyQty =
            normal && normal.days.size > 0 ? normal.qty / normal.days.size : 0
          const normalizedFestivalDailyQty = avgFestivalWindowQty / 16
          const upliftPct =
            normalDailyQty > 0
              ? ((normalizedFestivalDailyQty - normalDailyQty) / normalDailyQty) * 100
              : avgFestivalWindowQty > 0
                ? 100
                : 0
          const targetFestivalStock = Math.ceil(
            Math.max(
              avgFestivalWindowQty * 1.1,
              normalizedFestivalDailyQty > 0 ? normalizedFestivalDailyQty * 16 * 1.15 : 0,
            ),
          )
          return {
            sku,
            name: value.name,
            qty: value.qty,
            revenue: value.revenue,
            currentStock,
            avgFestivalWindowQty,
            normalDailyQty,
            upliftPct,
            suggestedFestivalRestock: Math.max(0, targetFestivalStock - currentStock),
          }
        })
        .sort((a, b) => {
          if (b.avgFestivalWindowQty !== a.avgFestivalWindowQty) return b.avgFestivalWindowQty - a.avgFestivalWindowQty
          if (b.upliftPct !== a.upliftPct) return b.upliftPct - a.upliftPct
          return b.revenue - a.revenue
        })
        .slice(0, 5)

      return {
        festival,
        revenue: stat.revenue,
        qty: stat.qty,
        activeDays: Math.max(1, stat.days.size),
        topProducts,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  const festivalLift = festivalSummary
    .map((entry) => {
      const dailyFestivalAvg = entry.revenue / Math.max(entry.activeDays, 1)
      const upliftPct =
        nonFestivalDailyAvg > 0 ? ((dailyFestivalAvg - nonFestivalDailyAvg) / nonFestivalDailyAvg) * 100 : 0
      return {
        festival: entry.festival,
        revenue: entry.revenue,
        upliftPct,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  const festivalProductLeaders = festivalSummary.flatMap((entry) =>
    entry.topProducts.map((product) => ({
      festival: entry.festival,
      ...product,
    })),
  )

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
    slowMovers: slowMoverCandidates
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 5)
      .map((m) => ({ sku: m.sku, name: m.name, qty: m.qty })),
    deadStockItems: deadStockCandidates
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 5)
      .map((m) => ({ sku: m.sku, name: m.name, qty: m.qty })),
    categoryBreakdown: [...catMap.entries()].map(([category, v]) => ({
      category,
      stockValue: v.stockValue,
      revenue: v.revenue,
      count: v.count,
    })),
    festivalLift,
    festivalProductLeaders,
    festivalSummary,
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
