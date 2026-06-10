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

function money(n: number, locale: 'bn' | 'en') {
  const value = Math.round(n).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')
  return locale === 'bn' ? `৳${value}` : `Tk ${value}`
}

function units(n: number, locale: 'bn' | 'en') {
  return Math.round(n).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')
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

function productName(product: Product, locale: 'bn' | 'en') {
  return locale === 'bn' ? product.nameBn || product.name : product.name
}

function forecastName(forecast: ProductForecast, locale: 'bn' | 'en') {
  return locale === 'bn' ? forecast.nameBn || forecast.name : forecast.name
}

function buildDiscountAdvice(
  target: { product: Product; qty30: number; daysCover: number } | null,
  locale: 'bn' | 'en',
): AdviceRecommendation | null {
  if (!target) return null
  const { product, qty30, daysCover } = target
  const pct = discountPercent(daysCover, qty30, product.stockQty)
  if (pct == null) return null

  const tied = product.stockQty * product.unitCost
  const name = productName(product, locale)
  const daysLabel =
    daysCover >= 999
      ? locale === 'bn'
        ? 'সাম্প্রতিক বিক্রি নেই'
        : 'no recent sales'
      : locale === 'bn'
        ? `${units(daysCover, locale)} দিনের স্টক কভার`
        : `${units(daysCover, locale)} days stock cover`

  return locale === 'bn'
    ? {
        titleBn: `ছাড়: ${name} - ${pct}%`,
        actionBn: `${name}-এ ঠিক ${pct}% ছাড় দিন। বর্তমান স্টক ${units(product.stockQty, locale)} পিস, গত ৩০ দিনে বিক্রি ${units(qty30, locale)} পিস (${daysLabel})। আটকে থাকা মূলধন প্রায় ${money(tied, locale)}।`,
        reasonBn: `বিক্রির গতি ধীর। ${pct}% ছাড় দিলে স্টকের প্রায় ৩৫% ক্লিয়ার হলে আনুমানিক ${money(tied * (pct / 100) * 0.35, locale)} নগদ ফিরে আসতে পারে।`,
        priority: 1,
        kind: 'discount',
      }
    : {
        titleBn: `Discount: ${name} - ${pct}%`,
        actionBn: `Apply exactly ${pct}% off ${name}. Stock ${units(product.stockQty, locale)} units, ${units(qty30, locale)} sold in 30 days (${daysLabel}). Capital tied up is about ${money(tied, locale)}.`,
        reasonBn: `Sell-through is slow. If about 35% of stock clears, this discount can release roughly ${money(tied * (pct / 100) * 0.35, locale)} in cash movement.`,
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

function buildReorderAdvice(forecast: ProductForecast, locale: 'bn' | 'en'): AdviceRecommendation {
  const name = forecastName(forecast, locale)
  const reorderUnits = Math.ceil(forecast.suggestedReorder)
  const daily = forecast.avgDailySales.toFixed(1)
  const days = forecast.daysUntilStockout ?? 0
  const demand7 = Math.round(forecast.forecast7d)

  return locale === 'bn'
    ? {
        titleBn: `রি-অর্ডার: ${name}`,
        actionBn: `${name} (${forecast.sku}) আজই ${units(reorderUnits, locale)} পিস অর্ডার করুন। স্টক ${units(forecast.currentStock, locale)} পিস, গড় দৈনিক বিক্রি ${daily} পিস, প্রায় ${units(Number(days), locale)} দিনে শেষ হতে পারে; ৭ দিনের চাহিদা প্রায় ${units(demand7, locale)} পিস।`,
        reasonBn: `পূর্বাভাসে ৭ দিনের চাহিদা ${units(demand7, locale)} পিস, যা বর্তমান স্টকের তুলনায় বেশি ঝুঁকিপূর্ণ। ${units(reorderUnits, locale)} পিস রি-অর্ডার করলে স্টকআউট ও হারানো বিক্রি কমবে।`,
        priority: 2,
        kind: 'reorder',
      }
    : {
        titleBn: `Reorder: ${name}`,
        actionBn: `Order exactly ${units(reorderUnits, locale)} units of ${name} (${forecast.sku}) today. Stock ${units(forecast.currentStock, locale)}, about ${daily} units/day, stockout in about ${units(Number(days), locale)} days; 7-day demand is about ${units(demand7, locale)} units.`,
        reasonBn: `Forecasted 7-day demand is ${units(demand7, locale)} units, so this reorder reduces stockout risk and protects near-term sales.`,
        priority: 2,
        kind: 'reorder',
      }
}

function buildFallbackReorder(products: Product[], sales: SaleRecord[], locale: 'bn' | 'en') {
  const q30 = qty30BySku(sales)
  let pick: { product: Product; sold: number; days: number; reorder: number } | null = null

  for (const product of products) {
    const sold = q30.get(product.sku) ?? 0
    const avg = sold / 30
    if (avg < 0.2) continue
    const days = product.stockQty / avg
    if (days < 14 && (!pick || days < pick.days)) {
      pick = { product, sold, days, reorder: Math.ceil(avg * 19 - product.stockQty) }
    }
  }

  if (!pick || pick.reorder <= 0) return null
  const name = productName(pick.product, locale)
  return locale === 'bn'
    ? {
        titleBn: `রি-অর্ডার: ${name}`,
        actionBn: `${name} - ${units(pick.reorder, locale)} পিস অর্ডার করুন। স্টক ${units(pick.product.stockQty, locale)}, ৩০ দিনে বিক্রি ${units(pick.sold, locale)} পিস।`,
        reasonBn: `বর্তমান বিক্রির গতিতে স্টক প্রায় ${units(pick.days, locale)} দিনের মধ্যে শেষ হতে পারে। এই অর্ডার প্রায় ১৪ দিনের চাহিদা কভার করবে।`,
        priority: 2,
        kind: 'reorder',
      }
    : {
        titleBn: `Reorder: ${name}`,
        actionBn: `Order ${units(pick.reorder, locale)} units of ${name}. Stock ${units(pick.product.stockQty, locale)}, ${units(pick.sold, locale)} sold in 30 days.`,
        reasonBn: `At current sell-through, stock may finish in about ${units(pick.days, locale)} days. This order covers roughly 14 days of demand.`,
        priority: 2,
        kind: 'reorder',
      }
}

function buildSecondaryPool(input: StructuredAdviceInput, locale: 'bn' | 'en'): AdviceRecommendation[] {
  const { analytics, products = [], sales = [], forecasts, graph } = input
  const pool: AdviceRecommendation[] = []
  const q30 = qty30BySku(sales)

  if (analytics.bestSeller) {
    const best = analytics.bestSeller
    const match = products.find((p) => p.name === best.name || p.nameBn === best.name || p.sku === best.name)
    const stock = match?.stockQty ?? 0
    const sold = match ? q30.get(match.sku) ?? 0 : 0
    const targetStock = Math.max(stock, Math.ceil(sold * 1.25) + 5)
    const add = Math.max(0, targetStock - stock)
    if (add > 0) {
      pool.push(
        locale === 'bn'
          ? {
              titleBn: `বেস্টসেলার স্টক: ${best.name}`,
              actionBn: `${best.name} গত ৩০ দিনে ${money(best.revenue, locale)} বিক্রি করেছে। স্টক ${units(stock, locale)} থেকে ${units(targetStock, locale)} পিসে নিন (+${units(add, locale)} পিস)।`,
              reasonBn: `এটি শীর্ষ আয়ের পণ্য। অতিরিক্ত ${units(add, locale)} পিস রাখলে আনুমানিক ${money(best.revenue * 0.12, locale)} বাড়তি বিক্রির সুযোগ তৈরি হতে পারে।`,
              priority: 3,
              kind: 'bestseller',
            }
          : {
              titleBn: `Stock up bestseller: ${best.name}`,
              actionBn: `${best.name} earned ${money(best.revenue, locale)} in 30 days. Raise stock from ${units(stock, locale)} to ${units(targetStock, locale)} units (+${units(add, locale)}).`,
              reasonBn: `This is the top revenue item. Extra stock can capture roughly ${money(best.revenue * 0.12, locale)} more sales if demand continues.`,
              priority: 3,
              kind: 'bestseller',
            },
      )
    }
  }

  const festival = analytics.festivalLift[0]
  if (festival && festival.upliftPct > 5) {
    const uplift = Math.round(festival.upliftPct)
    const extraRevenue = festival.revenue * 0.15
    pool.push(
      locale === 'bn'
        ? {
            titleBn: `উৎসব প্রস্তুতি: ${festival.festival}`,
            actionBn: `${festival.festival}-এ বিক্রি ${money(festival.revenue, locale)} (+${units(uplift, locale)}%)। সংশ্লিষ্ট স্টক ১৫% বাড়ান, লক্ষ্য বাড়তি ${money(extraRevenue, locale)} বিক্রি।`,
            reasonBn: `আপনার ডেটায় উৎসবের সময় চাহিদা ${units(uplift, locale)}% বেশি। আগে স্টক বাড়ালে স্টকআউট কমে।`,
            priority: 3,
            kind: 'festival',
          }
        : {
            titleBn: `Festival prep: ${festival.festival}`,
            actionBn: `${festival.festival} sales reached ${money(festival.revenue, locale)} (+${units(uplift, locale)}%). Increase related stock 15%; target extra sales of ${money(extraRevenue, locale)}.`,
            reasonBn: `Your data shows ${units(uplift, locale)}% festival uplift, so early stocking reduces stockout risk.`,
            priority: 3,
            kind: 'festival',
          },
    )
  }

  if (analytics.monthlyGrowthPct != null && Math.abs(analytics.monthlyGrowthPct) >= 3) {
    const pct = Number(analytics.monthlyGrowthPct.toFixed(1))
    const budget = Math.max(500, analytics.totalRevenue30d * 0.02)
    pool.push(
      locale === 'bn'
        ? {
            titleBn: 'বিক্রয় প্রবণতা',
            actionBn: `৩০ দিনের আয় ${money(analytics.totalRevenue30d, locale)} (${pct > 0 ? '+' : ''}${pct}%)। সেরা ক্যাটাগরিতে ${money(budget, locale)} প্রচার বাজেট রাখুন।`,
            reasonBn: `পরিবর্তনটি স্পষ্ট। আয়ের ২% প্রচারে দিলে ঝুঁকি কম রেখে ট্রেন্ড পরীক্ষা করা যায়।`,
            priority: 3,
            kind: 'growth',
          }
        : {
            titleBn: 'Sales trend',
            actionBn: `30-day revenue is ${money(analytics.totalRevenue30d, locale)} (${pct > 0 ? '+' : ''}${pct}%). Allocate ${money(budget, locale)} promo budget to the top category.`,
            reasonBn: `The movement is measurable; using 2% of revenue keeps the test controlled while responding to the trend.`,
            priority: 3,
            kind: 'growth',
          },
    )
  }

  const overstock = forecasts
    .filter((f) => f.currentStock > 40 && f.avgDailySales < 0.5)
    .sort((a, b) => b.currentStock - a.currentStock)[0]

  if (overstock) {
    const clearUnits = Math.min(overstock.currentStock - 10, Math.ceil(overstock.currentStock * 0.2))
    if (clearUnits > 0) {
      const name = forecastName(overstock, locale)
      pool.push(
        locale === 'bn'
          ? {
              titleBn: `অতিরিক্ত স্টক: ${name}`,
              actionBn: `${name}: স্টক ${units(overstock.currentStock, locale)} পিস, বিক্রি প্রায় ${overstock.avgDailySales.toFixed(1)}/দিন। ${units(clearUnits, locale)} পিস সরান বা বান্ডেল করুন।`,
              reasonBn: `চাহিদা কম। স্টকের ২০% সরালে মূলধন আটকে থাকা কমবে এবং তাকের জায়গা খালি হবে।`,
              priority: 3,
              kind: 'overstock',
            }
          : {
              titleBn: `Reduce overstock: ${name}`,
              actionBn: `${name}: ${units(overstock.currentStock, locale)} units on hand, about ${overstock.avgDailySales.toFixed(1)}/day. Move or bundle ${units(clearUnits, locale)} units.`,
              reasonBn: `Demand is low. Clearing about 20% reduces tied capital and frees shelf space.`,
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
            actionBn: `${names} একসাথে ৮% বান্ডেল ছাড়ে বিক্রি করুন।`,
            reasonBn: bundle.reasonBn || 'পণ্য সংযোগ বিশ্লেষণে এগুলো একসাথে বিক্রির সম্ভাবনা দেখা যাচ্ছে।',
            priority: 3,
            kind: 'bundle',
          }
        : {
            titleBn: 'Bundle offer',
            actionBn: `Sell ${names} together with an 8% bundle discount.`,
            reasonBn: bundle.reasonBn || 'Product graph analysis shows these items are likely to sell together.',
            priority: 3,
            kind: 'bundle',
          },
    )
  }

  const topCategory = [...analytics.categoryBreakdown].sort((a, b) => b.revenue - a.revenue)[0]
  if (topCategory && topCategory.revenue > 0) {
    const share = Math.round((topCategory.revenue / Math.max(analytics.totalRevenue30d, 1)) * 100)
    pool.push(
      locale === 'bn'
        ? {
            titleBn: `ক্যাটাগরি ফোকাস: ${topCategory.category}`,
            actionBn: `${topCategory.category} ৩০ দিনে ${money(topCategory.revenue, locale)} (${units(share, locale)}% আয়)। এই ক্যাটাগরিতে ২টি SKU যোগ করুন বা স্টক ১০% বাড়ান।`,
            reasonBn: `আয়ের ${units(share, locale)}% এই ক্যাটাগরি থেকে আসছে, তাই এখানে ফোকাস করলে ROI বেশি হওয়ার সম্ভাবনা।`,
            priority: 3,
            kind: 'category',
          }
        : {
            titleBn: `Category focus: ${topCategory.category}`,
            actionBn: `${topCategory.category} made ${money(topCategory.revenue, locale)} in 30 days (${units(share, locale)}% of revenue). Add 2 SKUs or raise stock 10%.`,
            reasonBn: `${units(share, locale)}% of revenue comes from this category, making it the highest-return focus area.`,
            priority: 3,
            kind: 'category',
          },
    )
  }

  return pool
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

  if (available.length === 0 && input.analytics.totalRevenue30d > 0) {
    available.push(
      locale === 'bn'
        ? {
            titleBn: 'নগদ প্রবাহ',
            actionBn: `৩০ দিনে মোট বিক্রি ${money(input.analytics.totalRevenue30d, locale)}। দৈনিক গড় ${money(input.analytics.totalRevenue30d / 30, locale)}; শীর্ষ ৩ SKU সপ্তাহে একবার চেক করুন।`,
            reasonBn: 'বিক্রি স্থিতিশীল হলে নিয়মিত স্টক অডিটই সবচেয়ে কার্যকর পরবর্তী পদক্ষেপ।',
            priority: 3,
            kind: 'cashflow',
          }
        : {
            titleBn: 'Cash flow',
            actionBn: `30-day sales are ${money(input.analytics.totalRevenue30d, locale)}. Daily average is ${money(input.analytics.totalRevenue30d / 30, locale)}; review top 3 SKUs weekly.`,
            reasonBn: 'When sales are stable, a structured stock review is the most effective next step.',
            priority: 3,
            kind: 'cashflow',
          },
    )
  }

  const secondaryIdx = hashSeed(adviceSeed, 2) % Math.max(available.length, 1)
  if (available.length > 0) recommendations.push({ ...available[secondaryIdx], priority: 3 })

  const finalRecs = recommendations.slice(0, 3).map((r, i) => ({ ...r, priority: i + 1 }))
  return {
    summaryBn: '',
    recommendations: finalRecs,
    adviceVariant: finalRecs.map((r) => r.kind).join(','),
  }
}
