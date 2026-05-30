/**
 * Deterministic owner advice: always 3 items with exact numbers from shop data.
 * Rotates secondary advice using adviceSeed (new seed each button click).
 */

function fmtMoney(n, locale) {
  const v = Math.round(n)
  return locale === 'bn' ? v.toLocaleString('bn-BD') : v.toLocaleString()
}

function hashSeed(seed, salt) {
  const s = Number(seed) || Date.now()
  return Math.abs(Math.imul(s + salt, 2654435761)) >>> 0
}

function qty30BySku(sales) {
  const cutoff = Date.now() - 30 * 86400000
  const map = new Map()
  for (const s of sales ?? []) {
    const t = Date.parse(s.saleDate?.slice(0, 10) ?? '')
    if (Number.isNaN(t) || t < cutoff) continue
    map.set(s.sku, (map.get(s.sku) ?? 0) + (s.qtySold ?? 0))
  }
  return map
}

function discountPercent(daysCover, qty30, stockQty) {
  if (stockQty <= 0) return null
  if (qty30 <= 0) return Math.min(25, 12 + Math.floor(stockQty / 15))
  if (daysCover >= 120) return 22
  if (daysCover >= 90) return 18
  if (daysCover >= 60) return 14
  if (daysCover >= 45) return 11
  if (qty30 <= 3) return 10
  return 8
}

function pickDiscountTarget(products, sales) {
  const q30 = qty30BySku(sales)
  let best = null
  let bestScore = -1

  for (const p of products ?? []) {
    if (p.stockQty <= 0) continue
    const sold = q30.get(p.sku) ?? 0
    const avgDaily = sold / 30
    const daysCover = avgDaily > 0 ? p.stockQty / avgDaily : 999
    const score = daysCover * 10 + p.stockQty - sold * 2
    if (score > bestScore) {
      bestScore = score
      best = { product: p, qty30: sold, daysCover, avgDaily }
    }
  }
  return best
}

function buildDiscountAdvice(target, locale) {
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

function buildReorderCandidates(forecasts) {
  return (forecasts ?? [])
    .filter((f) => (f.suggestedReorder ?? 0) > 0 && (f.daysUntilStockout ?? 99) < 21)
    .sort((a, b) => {
      const risk = { high: 0, medium: 1, low: 2 }
      const ra = risk[a.risk] ?? 2
      const rb = risk[b.risk] ?? 2
      if (ra !== rb) return ra - rb
      return (a.daysUntilStockout ?? 99) - (b.daysUntilStockout ?? 99)
    })
}

function buildReorderAdvice(forecast, locale) {
  if (!forecast) return null
  const name = locale === 'bn' ? forecast.nameBn || forecast.name : forecast.name
  const units = Math.ceil(forecast.suggestedReorder)
  const days = forecast.daysUntilStockout ?? '?'
  const daily = Number(forecast.avgDailySales ?? 0).toFixed(1)
  const f7 = Math.round(forecast.forecast7d ?? 0)

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

function buildSecondaryPool({ analytics, forecasts, products, sales, graph, locale }) {
  const pool = []
  const q30 = qty30BySku(sales)

  if (analytics?.bestSeller) {
    const bs = analytics.bestSeller
    const match = (products ?? []).find(
      (p) => p.name === bs.name || p.nameBn === bs.name || p.sku === bs.name,
    )
    const stock = match?.stockQty ?? 0
    const sold = match ? (q30.get(match.sku) ?? 0) : 0
    const targetStock = Math.max(stock, Math.ceil(sold * 1.25) + 5)
    const add = Math.max(0, targetStock - stock)

    if (add > 0) {
      if (locale === 'bn') {
        pool.push({
          titleBn: `বেস্টসেলার স্টক: ${bs.name}`,
          actionBn: `${bs.name} — গত ৩০ দিনে বিক্রয় ৳${fmtMoney(bs.revenue, 'bn')}। স্টক ${stock} পিস থেকে ${add} পিস বাড়ান (লক্ষ্য ${targetStock} পিস)।`,
          reasonBn: `শীর্ষ আয়ের পণ্য; স্টক বাড়ালে ৳${fmtMoney(bs.revenue * 0.12, 'bn')} পর্যন্ত অতিরিক্ত বিক্রয় সম্ভব (১২% ধরে)।`,
          priority: 3,
          kind: 'bestseller',
        })
      } else {
        pool.push({
          titleBn: `Stock up bestseller: ${bs.name}`,
          actionBn: `${bs.name} earned ৳${fmtMoney(bs.revenue, 'en')} in 30 days. Raise stock from ${stock} to ${targetStock} units (+${add}).`,
          reasonBn: `Top revenue SKU — +${add} units could capture ~৳${fmtMoney(bs.revenue * 0.12, 'en')} more sales (12% uplift est.).`,
          priority: 3,
          kind: 'bestseller',
        })
      }
    }
  }

  const fest = analytics?.festivalLift?.[0]
  if (fest && fest.upliftPct > 5) {
    const uplift = Math.round(fest.upliftPct)
    const extraRev = Math.round(fest.revenue * 0.15)
    if (locale === 'bn') {
      pool.push({
        titleBn: `উৎসব প্রস্তুতি: ${fest.festival}`,
        actionBn: `${fest.festival}-এ বিক্রয় ৳${fmtMoney(fest.revenue, 'bn')} (+${uplift}% বেসলাইনের উপরে)। এই ক্যাটাগরিতে স্টক ১৫% বাড়ান — লক্ষ্য অতিরিক্ত ৳${fmtMoney(extraRev, 'bn')} বিক্রয়।`,
        reasonBn: `উৎসব ডেটা অনুযায়ী চাহিদা ${uplift}% বেশি — আগে থেকে স্টক বাড়ালে স্টক আউট কমে।`,
        priority: 3,
        kind: 'festival',
      })
    } else {
      pool.push({
        titleBn: `Festival prep: ${fest.festival}`,
        actionBn: `${fest.festival} sales ৳${fmtMoney(fest.revenue, 'en')} (+${uplift}% vs baseline). Increase related stock by 15% — target +৳${fmtMoney(extraRev, 'en')} revenue.`,
        reasonBn: `Festival uplift ${uplift}% in your data — early stock reduces stockouts.`,
        priority: 3,
        kind: 'festival',
      })
    }
  }

  if (analytics?.monthlyGrowthPct != null && Math.abs(analytics.monthlyGrowthPct) >= 3) {
    const pct = Number(analytics.monthlyGrowthPct.toFixed(1))
    const rev = Math.round(analytics.totalRevenue30d ?? 0)
    if (locale === 'bn') {
      pool.push({
        titleBn: 'বিক্রয় প্রবণতা',
        actionBn: `গত ৩০ দিনে আয় ৳${fmtMoney(rev, 'bn')} (${pct > 0 ? '+' : ''}${pct}% পূর্ববর্তী ৩০ দিনের তুলনায়)। বেস্টসেলার ক্যাটাগরিতে বিজ্ঞাপন বাজেট ৳${fmtMoney(Math.max(500, rev * 0.02), 'bn')} রাখুন।`,
        reasonBn: `${pct > 0 ? 'বৃদ্ধি' : 'পতন'} দেখা যাচ্ছে — সংখ্যা অনুযায়ী ২% মার্কেটিং বাজেট সামঞ্জস্য করুন।`,
        priority: 3,
        kind: 'growth',
      })
    } else {
      pool.push({
        titleBn: 'Sales trend',
        actionBn: `30-day revenue ৳${fmtMoney(rev, 'en')} (${pct > 0 ? '+' : ''}${pct}% vs prior 30 days). Allocate ৳${fmtMoney(Math.max(500, rev * 0.02), 'en')} promo budget to top category.`,
        reasonBn: `Data shows ${pct}% MoM change — 2% of revenue as promo is a measured next step.`,
        priority: 3,
        kind: 'growth',
      })
    }
  }

  const overForecast = (forecasts ?? [])
    .filter((f) => f.currentStock > 40 && (f.avgDailySales ?? 0) < 0.5)
    .sort((a, b) => b.currentStock - a.currentStock)[0]

  if (overForecast) {
    const name = locale === 'bn' ? overForecast.nameBn || overForecast.name : overForecast.name
    const reduce = Math.min(overForecast.currentStock - 10, Math.ceil(overForecast.currentStock * 0.2))
    const prod = (products ?? []).find((p) => p.sku === overForecast.sku)
    const unitCost = prod?.unitCost ?? 80
    if (reduce > 0) {
      if (locale === 'bn') {
        pool.push({
          titleBn: `অতিরিক্ত স্টক কমান: ${name}`,
          actionBn: `${name}: স্টক ${overForecast.currentStock} পিস, দৈনিক বিক্রি ~${Number(overForecast.avgDailySales).toFixed(1)}। ${reduce} পিস সরান বা বান্ডেল করুন।`,
          reasonBn: `কম চাহিদায় ${reduce} পিস সরালে ~৳${fmtMoney(reduce * unitCost, 'bn')} নগদ মুক্ত।`,
          priority: 3,
          kind: 'overstock',
        })
      } else {
        pool.push({
          titleBn: `Reduce overstock: ${name}`,
          actionBn: `${name}: ${overForecast.currentStock} units on hand, ~${Number(overForecast.avgDailySales).toFixed(1)}/day. Move or bundle ${reduce} units.`,
          reasonBn: `Low velocity — clearing ${reduce} units frees working capital.`,
          priority: 3,
          kind: 'overstock',
        })
      }
    }
  }

  const bundle = graph?.bundleSuggestions?.[0]
  if (bundle?.products?.length >= 2) {
    const names = bundle.products.slice(0, 2).join(' + ')
    const bundleDisc = 8
    if (locale === 'bn') {
      pool.push({
        titleBn: 'বান্ডেল অফার',
        actionBn: `${names} একসাথে বিক্রি করুন — বান্ডেলে ${bundleDisc}% ছাড় (দুটি পণ্য একত্রে)।`,
        reasonBn: bundle.reasonBn || 'গ্রাফ বিশ্লেষণে একসাথে কেনা যায় এমন পণ্য জোড়া।',
        priority: 3,
        kind: 'bundle',
      })
    } else {
      pool.push({
        titleBn: 'Bundle offer',
        actionBn: `Sell ${names} together at ${bundleDisc}% bundle discount.`,
        reasonBn: bundle.reasonBn || 'Graph shows products often bought together.',
        priority: 3,
        kind: 'bundle',
      })
    }
  }

  const fri = analytics?.weekdayPattern?.find((d) =>
    /friday|শুক্র/i.test(d.day),
  )
  const mon = analytics?.weekdayPattern?.find((d) =>
    /monday|সোম/i.test(d.day),
  )
  if (fri && mon && fri.avgRevenue > mon.avgRevenue * 1.15) {
    const lift = Math.round(((fri.avgRevenue - mon.avgRevenue) / mon.avgRevenue) * 100)
    if (locale === 'bn') {
      pool.push({
        titleBn: 'শুক্রবার বিক্রয় বুস্ট',
        actionBn: `শুক্রবার গড় বিক্রয় ৳${fmtMoney(fri.avgRevenue, 'bn')} vs সোমবার ৳${fmtMoney(mon.avgRevenue, 'bn')} (+${lift}%)। শুক্রবার সকালে ফ্ল্যাশ ছাড় ৫% রাখুন।`,
        reasonBn: `ডেটায় শুক্রবার ${lift}% বেশি — নির্দিষ্ট ৫% ছাড় টাইম করা যায়।`,
        priority: 3,
        kind: 'weekday',
      })
    } else {
      pool.push({
        titleBn: 'Friday sales boost',
        actionBn: `Friday avg ৳${fmtMoney(fri.avgRevenue, 'en')} vs Monday ৳${fmtMoney(mon.avgRevenue, 'en')} (+${lift}%). Run a 5% Friday-morning flash sale.`,
        reasonBn: `Your data shows ${lift}% higher Friday revenue — timed 5% discount.`,
        priority: 3,
        kind: 'weekday',
      })
    }
  }

  const topCat = [...(analytics?.categoryBreakdown ?? [])].sort(
    (a, b) => b.revenue - a.revenue,
  )[0]
  if (topCat && topCat.revenue > 0) {
    const share = Math.round((topCat.revenue / Math.max(analytics.totalRevenue30d, 1)) * 100)
    if (locale === 'bn') {
      pool.push({
        titleBn: `ক্যাটাগরি ফোকাস: ${topCat.category}`,
        actionBn: `${topCat.category} — ৩০ দিনে ৳${fmtMoney(topCat.revenue, 'bn')} (${share}% মোট আয়)। এই ক্যাটাগরিতে ২টি নতুন SKU যোগ করুন বা স্টক ১০% বাড়ান।`,
        reasonBn: `${share}% আয় এই ক্যাটাগরি থেকে — ফোকাস করলে ROI বেশি।`,
        priority: 3,
        kind: 'category',
      })
    } else {
      pool.push({
        titleBn: `Category focus: ${topCat.category}`,
        actionBn: `${topCat.category}: ৳${fmtMoney(topCat.revenue, 'en')} in 30d (${share}% of revenue). Add 2 SKUs or +10% stock in this category.`,
        reasonBn: `${share}% of revenue from this category — highest ROI focus.`,
        priority: 3,
        kind: 'category',
      })
    }
  }

  return pool
}

function buildFallbackReorderFromProducts(products, sales, locale) {
  const q30 = qty30BySku(sales)
  let pick = null
  for (const p of products ?? []) {
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
  if (locale === 'bn') {
    return {
      titleBn: `রিঅর্ডার: ${name}`,
      actionBn: `${name} — ${units} পিস অর্ডার করুন। স্টক ${pick.p.stockQty}, ৩০ দিনে ${pick.sold} পিস বিক্রি, ~${Math.round(pick.days)} দিন কভার।`,
      reasonBn: `কম স্টক কভার — ${units} পিস দিয়ে ~১৪ দিনের চাহিদা মেটানো যায়।`,
      priority: 2,
      kind: 'reorder',
    }
  }
  return {
    titleBn: `Reorder: ${name}`,
    actionBn: `Order ${units} units of ${name}. Stock ${pick.p.stockQty}, ${pick.sold} sold in 30d, ~${Math.round(pick.days)} days cover.`,
    reasonBn: `${units} units covers ~14 days at current sell-through.`,
    priority: 2,
    kind: 'reorder',
  }
}

/**
 * @returns {{ summaryBn: string, recommendations: Array }}
 */
export function buildStructuredAdvice({
  shopName: _shopName,
  analytics,
  forecasts,
  products = [],
  sales = [],
  graph,
  locale = 'bn',
  adviceSeed = Date.now(),
}) {
  const recommendations = []

  const discount = buildDiscountAdvice(pickDiscountTarget(products, sales), locale)
  if (discount) recommendations.push(discount)

  const reorderList = buildReorderCandidates(forecasts)
  const reorderIdx = hashSeed(adviceSeed, 1) % Math.max(reorderList.length, 1)
  let reorder =
    reorderList.length > 0
      ? buildReorderAdvice(reorderList[reorderIdx], locale)
      : buildFallbackReorderFromProducts(products, sales, locale)

  if (reorder) {
    reorder.priority = 2
    recommendations.push(reorder)
  }

  const pool = buildSecondaryPool({ analytics, forecasts, products, sales, graph, locale })
  const usedKinds = new Set(recommendations.map((r) => r.kind))
  const available = pool.filter((p) => !usedKinds.has(p.kind))

  if (available.length === 0) {
    const rev = Math.round(analytics?.totalRevenue30d ?? 0)
    if (rev > 0) {
      if (locale === 'bn') {
        available.push({
          titleBn: 'নগদ প্রবাহ',
          actionBn: `গত ৩০ দিনে মোট বিক্রয় ৳${fmtMoney(rev, 'bn')}। দৈনিক গড় ৳${fmtMoney(rev / 30, 'bn')} — এই হার বজায় রাখতে শীর্ষ ৩ SKU-র স্টক সপ্তাহে একবার চেক করুন।`,
          reasonBn: 'স্থিতিশীল বিক্রয় — নিয়মিত স্টক অডিট যথেষ্ট।',
          priority: 3,
          kind: 'cashflow',
        })
      } else {
        available.push({
          titleBn: 'Cash flow',
          actionBn: `30-day sales ৳${fmtMoney(rev, 'en')} (avg ৳${fmtMoney(rev / 30, 'en')}/day). Review top 3 SKUs weekly to maintain this rate.`,
          reasonBn: 'Stable sales — structured stock review is enough.',
          priority: 3,
          kind: 'cashflow',
        })
      }
    }
  }

  const secondaryIdx = hashSeed(adviceSeed, 2) % Math.max(available.length, 1)
  if (available.length > 0) {
    const third = { ...available[secondaryIdx], priority: 3 }
    recommendations.push(third)
  }

  while (recommendations.length < 3 && pool.length > 0) {
    const extra = pool[hashSeed(adviceSeed, recommendations.length + 5) % pool.length]
    if (!recommendations.some((r) => r.titleBn === extra.titleBn)) {
      recommendations.push({ ...extra, priority: recommendations.length + 1 })
    } else break
  }

  const finalRecs = recommendations.slice(0, 3).map((r, i) => ({
    ...r,
    priority: i + 1,
  }))

  return {
    summaryBn: '',
    recommendations: finalRecs,
    adviceVariant: finalRecs.map((r) => r.kind).join(','),
  }
}
