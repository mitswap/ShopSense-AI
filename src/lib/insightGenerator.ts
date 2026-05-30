import type { Locale } from './i18n'
import {
  feedBundle,
  feedDeadStock,
  feedStockout,
  insightBestSeller,
  insightDeadStock,
  insightFestivalLift,
  insightFridaySpike,
  insightSalesGrowth,
  insightStockoutRisk,
  labelProduct,
} from './localeCopy'
import type {
  AnalyticsSummary,
  BusinessGraph,
  DataInsight,
  DecisionFeedItem,
  Product,
  ProductForecast,
  SaleRecord,
} from '../types'
import { productSalesTrend } from './analyticsEngine'

export function generateDataInsights(
  products: Product[],
  _sales: SaleRecord[],
  analytics: AnalyticsSummary,
  forecasts: ProductForecast[],
  locale: Locale = 'en',
): DataInsight[] {
  const insights: DataInsight[] = []

  if (analytics.monthlyGrowthPct !== null) {
    const { title, body } = insightSalesGrowth(
      locale,
      analytics.monthlyGrowthPct,
      analytics.totalRevenue30d,
    )
    insights.push({
      id: 'growth',
      type: 'trend',
      titleBn: title,
      explanationBn: body,
      metrics: { growthPct: analytics.monthlyGrowthPct, revenue30d: analytics.totalRevenue30d },
      confidence: 0.9,
    })
  }

  if (analytics.bestSeller) {
    const { title, body } = insightBestSeller(
      locale,
      analytics.bestSeller.name,
      analytics.bestSeller.revenue,
    )
    insights.push({
      id: 'best-seller',
      type: 'trend',
      titleBn: title,
      explanationBn: body,
      metrics: { revenue: analytics.bestSeller.revenue },
      confidence: 0.95,
    })
  }

  const topFestival = analytics.festivalLift[0]
  if (topFestival && topFestival.upliftPct > 5) {
    const { title, body } = insightFestivalLift(locale, topFestival.festival, topFestival.revenue)
    insights.push({
      id: 'festival-lift',
      type: 'trend',
      titleBn: title,
      explanationBn: body,
      metrics: { festival: topFestival.festival, revenue: topFestival.revenue },
      confidence: 0.88,
    })
  }

  const fri = analytics.weekdayPattern[5]
  const avg =
    analytics.weekdayPattern.reduce((s, d) => s + d.avgRevenue, 0) /
    Math.max(analytics.weekdayPattern.length, 1)
  if (fri && avg > 0 && fri.avgRevenue > avg * 1.15) {
    const pct = ((fri.avgRevenue / avg - 1) * 100).toFixed(0)
    const { title, body } = insightFridaySpike(locale, pct)
    insights.push({
      id: 'friday-spike',
      type: 'trend',
      titleBn: title,
      explanationBn: body,
      metrics: { fridayAvg: fri.avgRevenue, overallAvg: avg },
      confidence: 0.85,
    })
  }

  for (const f of forecasts.filter((x) => x.risk === 'high').slice(0, 3)) {
    const { title, body } = insightStockoutRisk(
      locale,
      f.name,
      f.daysUntilStockout,
      f.avgDailySales,
      f.suggestedReorder,
    )
    insights.push({
      id: `forecast-${f.sku}`,
      type: 'forecast',
      titleBn: title,
      explanationBn: body,
      metrics: { daysLeft: f.daysUntilStockout ?? 0, reorder: f.suggestedReorder },
      confidence: 0.82,
    })
  }

  if (analytics.deadStockCount > 0) {
    const dead = products.filter((p) => {
      const f = forecasts.find((x) => x.sku === p.sku)
      return f && f.avgDailySales < 0.1 && p.stockQty > 30
    })
    if (dead[0]) {
      const { title, body } = insightDeadStock(locale, dead[0].name, dead[0].stockQty)
      insights.push({
        id: 'dead-stock',
        type: 'anomaly',
        titleBn: title,
        explanationBn: body,
        metrics: { stock: dead[0].stockQty },
        confidence: 0.8,
      })
    }
  }

  return insights
}

export function generateDecisionFeed(
  analytics: AnalyticsSummary,
  forecasts: ProductForecast[],
  insights: DataInsight[],
  graph: BusinessGraph,
  locale: Locale = 'en',
): DecisionFeedItem[] {
  const feed: DecisionFeedItem[] = []

  for (const f of forecasts.filter((x) => x.risk === 'high').slice(0, 3)) {
    const { title, body, action } = feedStockout(
      locale,
      f.name,
      f.daysUntilStockout,
      f.suggestedReorder,
      f.currentStock,
      f.avgDailySales,
    )
    feed.push({
      id: `feed-stockout-${f.sku}`,
      icon: 'warning',
      titleBn: title,
      bodyBn: body,
      actionBn: action,
      severity: 'high',
      evidence: [
        locale === 'bn'
          ? `স্টক: ${f.currentStock}`
          : `Stock: ${f.currentStock}`,
        locale === 'bn'
          ? `গড় দৈনিক বিক্রয়: ${f.avgDailySales}`
          : `Avg daily sales: ${f.avgDailySales}`,
      ],
      relatedSku: f.sku,
    })
  }

  for (const ins of insights.filter((i) => i.type === 'trend').slice(0, 2)) {
    feed.push({
      id: `feed-ins-${ins.id}`,
      icon: 'trend',
      titleBn: ins.titleBn,
      bodyBn: ins.explanationBn,
      severity: 'medium',
      evidence: Object.entries(ins.metrics).map(([k, v]) => `${k}: ${v}`),
    })
  }

  for (const b of graph.bundleSuggestions.slice(0, 2)) {
    const { title, body, action } = feedBundle(locale, b.products)
    feed.push({
      id: `feed-bundle-${b.products.join('-')}`,
      icon: 'insight',
      titleBn: title,
      bodyBn: body,
      actionBn: action,
      severity: 'low',
      evidence: b.products.map((p) => labelProduct(p, locale)),
    })
  }

  if (analytics.deadStockCount > 0) {
    const { title, body, action } = feedDeadStock(locale, analytics.deadStockCount)
    feed.push({
      id: 'feed-dead',
      icon: 'warning',
      titleBn: title,
      bodyBn: body,
      actionBn: action,
      severity: 'medium',
      evidence: [
        locale === 'bn'
          ? `ডেড স্টক সংখ্যা: ${analytics.deadStockCount}`
          : `Dead stock count: ${analytics.deadStockCount}`,
      ],
    })
  }

  return feed.sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 }
    return o[a.severity] - o[b.severity]
  })
}

export function buildRootCauseContext(
  productQuery: string,
  products: Product[],
  sales: SaleRecord[],
  _analytics: AnalyticsSummary,
  locale: Locale = 'en',
): string {
  const match =
    products.find((p) => p.name.toLowerCase().includes(productQuery.toLowerCase())) ??
    products.find((p) => productQuery.toLowerCase().includes(p.name.toLowerCase().slice(0, 4)))

  if (!match) {
    return locale === 'bn'
      ? `ডেটায় "${productQuery}" পণ্য পাওয়া যায়নি।`
      : `Product "${productQuery}" not found in data.`
  }

  const trend = productSalesTrend(match.name, sales)
  const productSales = sales.filter((s) => s.sku === match.sku)
  const festivalSales = new Map<string, number>()

  for (const s of productSales) {
    const f = s.festival?.trim() || 'None'
    if (f !== 'None') festivalSales.set(f, (festivalSales.get(f) ?? 0) + s.revenue)
  }

  let trendDir = locale === 'bn' ? 'স্থির' : 'flat'
  if (trend.length >= 2) {
    const last = trend[trend.length - 1].revenue
    const prev = trend[trend.length - 2].revenue
    if (last < prev * 0.8) trendDir = locale === 'bn' ? 'কমছে' : 'declining'
    else if (last > prev * 1.2) trendDir = locale === 'bn' ? 'বাড়ছে' : 'rising'
  }

  const pName = labelProduct(match.name, locale)
  const cat = locale === 'bn' ? 'ক্যাটাগরি' : 'Category'
  const trendLabel = locale === 'bn' ? 'প্রবণতা' : 'Trend'
  const monthlyLabel = locale === 'bn' ? 'মাসিক' : 'Monthly'
  const festLabel = locale === 'bn' ? 'উৎসবে বিক্রয়' : 'Festival sales'
  const stockLabel = locale === 'bn' ? 'বর্তমান স্টক' : 'Current stock'

  return `
${locale === 'bn' ? 'পণ্য' : 'Product'}: ${pName} (${cat}: ${match.category})
${trendLabel}: ${trendDir}
${monthlyLabel}: ${trend.map((t) => `${t.period}: ৳${Math.round(t.revenue)}`).join(', ')}
${festLabel}: ${[...festivalSales.entries()].map(([f, r]) => `${f}=৳${Math.round(r)}`).join(', ') || (locale === 'bn' ? 'নেই' : 'N/A')}
${stockLabel}: ${match.stockQty}
`.trim()
}
