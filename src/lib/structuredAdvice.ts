import type {
  AnalyticsSummary,
  BusinessGraph,
  Product,
  ProductForecast,
  SaleRecord,
} from '../types'

export interface StructuredAdviceInput {
  shopName?: string
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
  products?: Product[]
  sales?: SaleRecord[]
  graph?: BusinessGraph
  locale?: 'bn' | 'en'
  adviceSeed?: number
}

export interface AdviceRecommendation {
  titleBn: string
  actionBn: string
  reasonBn?: string
  priority: number
  kind?: string
}

function fmtMoney(n: number, locale: 'bn' | 'en') {
  const v = Math.round(n)
  return locale === 'bn' ? v.toLocaleString('bn-BD') : v.toLocaleString()
}

function hashSeed(seed: number, salt: number) {
  const s = Number(seed) || Date.now()
  return Math.abs(Math.imul(s + salt, 2654435761)) >>> 0
}

function qty30BySku(sales: SaleRecord[]) {
  const cutoff = Date.now() - 30 * 86400000
  const map = new Map<string, number>()
  for (const s of sales ?? []) {
    const t = Date.parse(s.saleDate?.slice(0, 10) ?? '')
    if (Number.isNaN(t) || t < cutoff) continue
    map.set(s.sku, (map.get(s.sku) ?? 0) + s.qtySold)
  }
  return map
}

function discountPercent(daysCover: number, qty30: number, stockQty: number): number | null {
  if (stockQty <= 0) return null
  if (qty30 <= 0) return Math.min(25, 12 + Math.floor(stockQty / 15))
  if (daysCover >= 120) return 22
  if (daysCover >= 90) return 18
  if (daysCover >= 60) return 14
  if (daysCover >= 45) return 11
  if (qty30 <= 3) return 10
  return 8
}

function pickDiscountTarget(products: Product[], sales: SaleRecord[]) {
  const q30 = qty30BySku(sales)
  let best: { product: Product; qty30: number; daysCover: number } | null = null
  let bestScore = -1

  for (const p of products ?? []) {
    if (p.stockQty <= 0) continue
    const sold = q30.get(p.sku) ?? 0
    const avgDaily = sold / 30
    const daysCover = avgDaily > 0 ? p.stockQty / avgDaily : 999
    const score = daysCover * 10 + p.stockQty - sold * 2
    if (score > bestScore) {
      bestScore = score
      best = { product: p, qty30: sold, daysCover }
    }
  }
  return best
}

function buildDiscountAdvice(
  target: { product: Product; qty30: number; daysCover: number } | null,
  locale: 'bn' | 'en',
): AdviceRecommendation | null {
  if (!target) return null
  const { product: p, qty30, daysCover } = target
  const pct = discountPercent(daysCover, qty30, p.stockQty)
  if (pct == null) return null

  const tied = Math.round(p.stockQty * p.unitCost)
  const name = locale === 'bn' ? p.nameBn || p.name : p.name
  const daysLabel =
    daysCover >= 999
      ? locale === 'bn'
        ? 'বিক্রি নেই'
        : 'no recent sales'
      : locale === 'bn'
        ? `${Math.round(daysCover)} দিনের স্টক কভার`
        : `${Math.round(daysCover)} days stock cover`

  if (locale === 'bn') {
    return {
      titleBn: `ছাড়: ${name} — ${pct}%`,
      actionBn: `${name}-এ ঠিক ${pct}% ছাড় দিন। বর্তমান স্টক ${p.stockQty} পিস, গত ৩০ দিনে বিক্রি ${qty30} পিস (${daysLabel})। আটকানো মূলধন প্রায় ৳${fmtMoney(tied, 'bn')}।`,
      reasonBn: `ধীর বিক্রির হারে ${pct}% ছাড়ে আনুমানিক ৳${fmtMoney(tied * (pct / 100) * 0.35, 'bn')} নগদ ফিরে আসতে পারে (৩৫% বিক্রি ধরে)।`,
      priority: 1,
      kind: 'discount',
    }
  }

  return {
    titleBn: `Discount: ${name} — ${pct}%`,
    actionBn: `Apply exactly ${pct}% off ${name}. Stock ${p.stockQty} units, ${qty30} sold in 30 days (${daysLabel}). Capital tied up ≈ ৳${fmtMoney(tied, 'en')}.`,
    reasonBn: `At current sell-through, ${pct}% off could recover ~৳${fmtMoney(tied * (pct / 100) * 0.35, 'en')} if ~35% of stock clears.`,
    priority: 1,
    kind: 'discount',
  }
}

function buildReorderCandidates(forecasts: ProductForecast[]) {
  return forecasts
    .filter((f) => f.suggestedReorder > 0 && (f.daysUntilStockout ?? 99) < 21)
    .sort((a, b) => {
      const risk = { high: 0, medium: 1, low: 2 }
      const ra = risk[a.risk] ?? 2
      const rb = risk[b.risk] ?? 2
      if (ra !== rb) return ra - rb
      return (a.daysUntilStockout ?? 99) - (b.daysUntilStockout ?? 99)
    })
}

function buildReorderAdvice(
  forecast: ProductForecast,
  locale: 'bn' | 'en',
): AdviceRecommendation {
  const name = locale === 'bn' ? forecast.nameBn || forecast.name : forecast.name
  const units = Math.ceil(forecast.suggestedReorder)
  const days = forecast.daysUntilStockout ?? '?'
  const daily = forecast.avgDailySales.toFixed(1)
  const f7 = Math.round(forecast.forecast7d)

  if (locale === 'bn') {
    return {
      titleBn: `রিঅর্ডার: ${name}`,
      actionBn: `${name} (${forecast.sku}) — আজই ${units} পিস অর্ডার করুন। স্টক ${forecast.currentStock} পিস, গড় দৈনিক বিক্রি ${daily} পিস, ${days} দিনে শেষ হতে পারে; আগামী ৭ দিনের চাহিদা ~${f7} পিস।`,
      reasonBn: `ফোরকাস্ট অনুযায়ী ৭ দিনের চাহিদা ${f7} পিসের বিরুদ্ধে স্টক কম — স্টক আউট এড়াতে ${units} পিস রিঅর্ডার।`,
      priority: 2,
      kind: 'reorder',
    }
  }

  return {
    titleBn: `Reorder: ${name}`,
    actionBn: `Order exactly ${units} units of ${name} (${forecast.sku}) today. Stock ${forecast.currentStock}, ~${daily} units/day, stockout in ~${days} days; 7-day demand ~${f7} units.`,
    reasonBn: `Forecast 7-day demand is ${f7} units — reorder ${units} to avoid lost sales.`,
    priority: 2,
    kind: 'reorder',
  }
}

function buildSecondaryPool(
  input: StructuredAdviceInput,
  locale: 'bn' | 'en',
): AdviceRecommendation[] {
  const { analytics, forecasts, products = [], sales = [], graph } = input
  const pool: AdviceRecommendation[] = []
  const q30 = qty30BySku(sales)

  if (analytics.bestSeller) {
    const bs = analytics.bestSeller
    const match = products.find(
      (p) => p.name === bs.name || p.nameBn === bs.name || p.sku === bs.name,
    )
    const stock = match?.stockQty ?? 0
    const sold = match ? (q30.get(match.sku) ?? 0) : 0
    const targetStock = Math.max(stock, Math.ceil(sold * 1.25) + 5)
    const add = Math.max(0, targetStock - stock)

    if (add > 0) {
      pool.push(
        locale === 'bn'
          ? {
              titleBn: `বেস্টসেলার স্টক: ${bs.name}`,
              actionBn: `${bs.name} — গত ৩০ দিনে বিক্রয় ৳${fmtMoney(bs.revenue, 'bn')}। স্টক ${stock} পিস থেকে ${add} পিস বাড়ান (লক্ষ্য ${targetStock} পিস)।`,
              reasonBn: `শীর্ষ আয়ের পণ্য; স্টক বাড়ালে ৳${fmtMoney(bs.revenue * 0.12, 'bn')} পর্যন্ত অতিরিক্ত বিক্রয় সম্ভব।`,
              priority: 3,
              kind: 'bestseller',
            }
          : {
              titleBn: `Stock up bestseller: ${bs.name}`,
              actionBn: `${bs.name} earned ৳${fmtMoney(bs.revenue, 'en')} in 30 days. Raise stock from ${stock} to ${targetStock} units (+${add}).`,
              reasonBn: `Top revenue SKU — +${add} units could capture ~৳${fmtMoney(bs.revenue * 0.12, 'en')} more sales.`,
              priority: 3,
              kind: 'bestseller',
            },
      )
    }
  }

  const fest = analytics.festivalLift[0]
  if (fest && fest.upliftPct > 5) {
    const uplift = Math.round(fest.upliftPct)
    const extraRev = Math.round(fest.revenue * 0.15)
    pool.push(
      locale === 'bn'
        ? {
            titleBn: `উৎসব প্রস্তুতি: ${fest.festival}`,
            actionBn: `${fest.festival}-এ বিক্রয় ৳${fmtMoney(fest.revenue, 'bn')} (+${uplift}%)। স্টক ১৫% বাড়ান — লক্ষ্য +৳${fmtMoney(extraRev, 'bn')}।`,
            reasonBn: `উৎসব ডেটায় চাহিদা ${uplift}% বেশি।`,
            priority: 3,
            kind: 'festival',
          }
        : {
            titleBn: `Festival prep: ${fest.festival}`,
            actionBn: `${fest.festival} sales ৳${fmtMoney(fest.revenue, 'en')} (+${uplift}%). Increase stock 15% — target +৳${fmtMoney(extraRev, 'en')}.`,
            reasonBn: `Festival uplift ${uplift}% in your data.`,
            priority: 3,
            kind: 'festival',
          },
    )
  }

  if (analytics.monthlyGrowthPct != null && Math.abs(analytics.monthlyGrowthPct) >= 3) {
    const pct = Number(analytics.monthlyGrowthPct.toFixed(1))
    const rev = Math.round(analytics.totalRevenue30d)
    pool.push(
      locale === 'bn'
        ? {
            titleBn: 'বিক্রয় প্রবণতা',
            actionBn: `৩০ দিনে আয় ৳${fmtMoney(rev, 'bn')} (${pct > 0 ? '+' : ''}${pct}%)। প্রচার বাজেট ৳${fmtMoney(Math.max(500, rev * 0.02), 'bn')}।`,
            reasonBn: 'ডেটা-ভিত্তিক ২% মার্কেটিং বাজেট।',
            priority: 3,
            kind: 'growth',
          }
        : {
            titleBn: 'Sales trend',
            actionBn: `30-day revenue ৳${fmtMoney(rev, 'en')} (${pct > 0 ? '+' : ''}${pct}%). Promo budget ৳${fmtMoney(Math.max(500, rev * 0.02), 'en')}.`,
            reasonBn: '2% of revenue as measured promo step.',
            priority: 3,
            kind: 'growth',
          },
    )
  }

  const overForecast = forecasts
    .filter((f) => f.currentStock > 40 && f.avgDailySales < 0.5)
    .sort((a, b) => b.currentStock - a.currentStock)[0]

  if (overForecast) {
    const name =
      locale === 'bn' ? overForecast.nameBn || overForecast.name : overForecast.name
    const reduce = Math.min(
      overForecast.currentStock - 10,
      Math.ceil(overForecast.currentStock * 0.2),
    )
    if (reduce > 0) {
      pool.push(
        locale === 'bn'
          ? {
              titleBn: `অতিরিক্ত স্টক: ${name}`,
              actionBn: `${name}: স্টক ${overForecast.currentStock} পিস, বিক্রি ~${overForecast.avgDailySales.toFixed(1)}/দিন। ${reduce} পিস সরান।`,
              reasonBn: 'কম চাহিদায় স্টক কমান।',
              priority: 3,
              kind: 'overstock',
            }
          : {
              titleBn: `Reduce overstock: ${name}`,
              actionBn: `${name}: ${overForecast.currentStock} units, ~${overForecast.avgDailySales.toFixed(1)}/day. Clear ${reduce} units.`,
              reasonBn: 'Low velocity — free working capital.',
              priority: 3,
              kind: 'overstock',
            },
      )
    }
  }

  const bundle = graph?.bundleSuggestions[0]
  if (bundle && bundle.products.length >= 2) {
    const names = bundle.products.slice(0, 2).join(' + ')
    pool.push(
      locale === 'bn'
        ? {
            titleBn: 'বান্ডেল অফার',
            actionBn: `${names} — বান্ডেলে ৮% ছাড়।`,
            reasonBn: bundle.reasonBn,
            priority: 3,
            kind: 'bundle',
          }
        : {
            titleBn: 'Bundle offer',
            actionBn: `${names} — 8% bundle discount.`,
            reasonBn: bundle.reasonBn,
            priority: 3,
            kind: 'bundle',
          },
    )
  }

  const topCat = [...analytics.categoryBreakdown].sort((a, b) => b.revenue - a.revenue)[0]
  if (topCat && topCat.revenue > 0) {
    const share = Math.round((topCat.revenue / Math.max(analytics.totalRevenue30d, 1)) * 100)
    pool.push(
      locale === 'bn'
        ? {
            titleBn: `ক্যাটাগরি: ${topCat.category}`,
            actionBn: `${topCat.category}: ৳${fmtMoney(topCat.revenue, 'bn')} (${share}% আয়)। স্টক ১০% বাড়ান।`,
            reasonBn: `${share}% আয় এই ক্যাটাগরি থেকে।`,
            priority: 3,
            kind: 'category',
          }
        : {
            titleBn: `Category: ${topCat.category}`,
            actionBn: `${topCat.category}: ৳${fmtMoney(topCat.revenue, 'en')} (${share}% revenue). +10% stock.`,
            reasonBn: `${share}% of revenue from this category.`,
            priority: 3,
            kind: 'category',
          },
    )
  }

  return pool
}

function buildFallbackReorder(
  products: Product[],
  sales: SaleRecord[],
  locale: 'bn' | 'en',
): AdviceRecommendation | null {
  const q30 = qty30BySku(sales)
  let pick: { p: Product; sold: number; days: number; reorder: number } | null = null

  for (const p of products) {
    const sold = q30.get(p.sku) ?? 0
    const avg = sold / 30
    if (avg < 0.2) continue
    const days = p.stockQty / avg
    if (days < 14 && (!pick || days < pick.days)) {
      pick = { p, sold, days, reorder: Math.ceil(avg * 14 + avg * 5 - p.stockQty) }
    }
  }
  if (!pick || pick.reorder <= 0) return null
  const name = locale === 'bn' ? pick.p.nameBn || pick.p.name : pick.p.name
  const units = pick.reorder

  return locale === 'bn'
    ? {
        titleBn: `রিঅর্ডার: ${name}`,
        actionBn: `${name} — ${units} পিস অর্ডার করুন। স্টক ${pick.p.stockQty}, ৩০ দিনে ${pick.sold} পিস বিক্রি।`,
        reasonBn: `${units} পিস ~১৪ দিনের চাহিদা মেটায়।`,
        priority: 2,
        kind: 'reorder',
      }
    : {
        titleBn: `Reorder: ${name}`,
        actionBn: `Order ${units} units. Stock ${pick.p.stockQty}, ${pick.sold} sold in 30d.`,
        reasonBn: `${units} units covers ~14 days sell-through.`,
        priority: 2,
        kind: 'reorder',
      }
}

export function buildStructuredAdvice(input: StructuredAdviceInput) {
  const locale = input.locale ?? 'bn'
  const adviceSeed = input.adviceSeed ?? Date.now()
  const products = input.products ?? []
  const sales = input.sales ?? []
  const recommendations: AdviceRecommendation[] = []

  const discount = buildDiscountAdvice(pickDiscountTarget(products, sales), locale)
  if (discount) recommendations.push(discount)

  const reorderList = buildReorderCandidates(input.forecasts)
  const reorderIdx = hashSeed(adviceSeed, 1) % Math.max(reorderList.length, 1)
  const reorder =
    reorderList.length > 0
      ? buildReorderAdvice(reorderList[reorderIdx], locale)
      : buildFallbackReorder(products, sales, locale)

  if (reorder) recommendations.push(reorder)

  const pool = buildSecondaryPool(input, locale)
  const usedKinds = new Set(recommendations.map((r) => r.kind))
  const available = pool.filter((p) => !usedKinds.has(p.kind))

  if (available.length === 0 && (input.analytics.totalRevenue30d ?? 0) > 0) {
    const rev = Math.round(input.analytics.totalRevenue30d)
    available.push(
      locale === 'bn'
        ? {
            titleBn: 'নগদ প্রবাহ',
            actionBn: `৩০ দিনে বিক্রয় ৳${fmtMoney(rev, 'bn')} (গড় ৳${fmtMoney(rev / 30, 'bn')}/দিন)। শীর্ষ ৩ SKU সাপ্তাহিক চেক করুন।`,
            reasonBn: 'স্থিতিশীল বিক্রয় — নিয়মিত অডিট।',
            priority: 3,
            kind: 'cashflow',
          }
        : {
            titleBn: 'Cash flow',
            actionBn: `30-day sales ৳${fmtMoney(rev, 'en')} (avg ৳${fmtMoney(rev / 30, 'en')}/day). Review top 3 SKUs weekly.`,
            reasonBn: 'Stable sales — structured review.',
            priority: 3,
            kind: 'cashflow',
          },
    )
  }

  const secondaryIdx = hashSeed(adviceSeed, 2) % Math.max(available.length, 1)
  if (available.length > 0) {
    recommendations.push({ ...available[secondaryIdx], priority: 3 })
  }

  const finalRecs = recommendations.slice(0, 3).map((r, i) => ({ ...r, priority: i + 1 }))

  return {
    summaryBn: '',
    recommendations: finalRecs,
    adviceVariant: finalRecs.map((r) => r.kind).join(','),
  }
}
