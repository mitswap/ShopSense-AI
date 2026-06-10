import type { Locale } from './i18n-types'
import { labelFestival, labelProduct } from './localeCopy'
import type { AnalyticsSummary, Product, ShopData } from '../types'
import { productSalesTrend } from './analyticsEngine'

function normalizeLookupText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildProductAliases(product: Product): string[] {
  return [
    product.name,
    product.nameBn,
    product.category,
    labelProduct(product.name, 'bn'),
  ]
    .map((value) => normalizeLookupText(String(value ?? '')))
    .filter(Boolean)
}

function findProductMatch(query: string, shop: ShopData): Product | null {
  const normalizedQuery = normalizeLookupText(query)

  for (const product of shop.products) {
    const aliases = buildProductAliases(product)
    if (aliases.some((alias) => normalizedQuery.includes(alias))) return product
  }

  return null
}

function extractSpecificStockSubject(query: string): string | null {
  const raw = String(query ?? '').toLowerCase().trim()
  const patterns = [
    /how many\s+(.+?)\s+(?:do i have|are there|are in)\s+(?:my\s+)?(?:current\s+)?(?:stock|inventory)\b/,
    /do i have\s+(.+?)\s+(?:in\s+(?:my\s+)?(?:current\s+)?(?:stock|inventory)|available)\b/,
    /(?:current\s+)?(?:stock|inventory)\s+of\s+(.+?)\b/,
    /(.+?)\s+in\s+(?:my\s+)?(?:current\s+)?(?:stock|inventory)\b/,
    /আমার\s+(.+?)\s+(?:স্টক|ইনভেন্টরি)(?:তে|তে আছে| আছে)?/,
    /(.+?)\s+(?:স্টক|ইনভেন্টরি)(?:তে|তে আছে| আছে)?/,
  ]

  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (!match?.[1]) continue
    const subject = normalizeLookupText(match[1].replace(/^(the|my|our)\s+/i, ''))
    if (subject) return subject
  }

  return null
}

function isGenericInventorySubject(subject: string): boolean {
  const genericSubjects = new Set([
    'stock',
    'inventory',
    'item',
    'items',
    'product',
    'products',
    'sku',
    'skus',
    'all',
    'all items',
    'all products',
    'anything',
  ])

  return genericSubjects.has(subject)
}

function buildMissingProductAnswer(subject: string, locale: Locale): string {
  if (locale === 'bn') {
    return `${subject} নামে কোনো পণ্য আপনার বর্তমান ইনভেন্টরিতে নেই।`
  }
  return `No ${subject} are in your current inventory.`
}

function buildProductStockAnswer(product: Product, locale: Locale): string {
  const label = labelProduct(product.name, locale)
  const qty =
    locale === 'bn'
      ? Math.round(product.stockQty).toLocaleString('bn-BD')
      : Math.round(product.stockQty).toLocaleString()

  if (locale === 'bn') {
    return `${label}: বর্তমানে স্টকে ${qty} পিস আছে।`
  }
  return `${product.name}: you currently have ${qty} unit(s) in stock.`
}

function detectFestivalInQuery(query: string): string | null {
  const q = String(query ?? '').toLowerCase()
  if (q.includes('eid') || q.includes('ঈদ')) return 'Eid'
  if (q.includes('puja') || q.includes('পূজা') || q.includes('durga')) return 'Puja'
  if (q.includes('festival') || q.includes('উৎসব')) return 'festival'
  return null
}

function findFestivalSummary(analytics: AnalyticsSummary, festival: string | null) {
  if (!festival || festival === 'festival') return analytics.festivalSummary?.[0] ?? null
  return analytics.festivalSummary?.find((item) => item.festival.toLowerCase() === festival.toLowerCase()) ?? null
}

function matchesFestivalProductQuery(query: string): boolean {
  const q = String(query ?? '').toLowerCase()
  return (
    q.includes('restock') ||
    q.includes('reorder') ||
    q.includes('sell') ||
    q.includes('sold') ||
    q.includes('top product') ||
    q.includes('best product') ||
    q.includes('more selling') ||
    q.includes('বিক্রি') ||
    q.includes('রিস্টক') ||
    q.includes('অর্ডার')
  )
}

function formatUnits(value: number, locale: Locale) {
  return locale === 'bn'
    ? Math.round(value).toLocaleString('bn-BD')
    : Math.round(value).toLocaleString()
}

function buildFestivalSummaryAnswer(
  summary: NonNullable<AnalyticsSummary['festivalSummary']>[number] | null,
  locale: Locale,
): string {
  if (!summary) {
    return locale === 'bn' ? 'ফাইলের মধ্যে উৎসবভিত্তিক বিক্রির তথ্য পাওয়া যায়নি।' : 'No festival sales data were found in your file.'
  }

  const topProducts = summary.topProducts.slice(0, 3).map((item) => labelProduct(item.name, locale)).join(', ')
  const revenue = formatUnits(summary.revenue, locale)
  const qty = formatUnits(summary.qty, locale)

  if (locale === 'bn') {
    return `${labelFestival(summary.festival, locale)}-এ মোট বিক্রি ৳${revenue}, মোট ${qty} ইউনিট। শীর্ষ পণ্য: ${topProducts || 'তথ্য নেই'}।`
  }
  return `${summary.festival} generated Tk ${revenue} from ${qty} units. Top products: ${topProducts || 'n/a'}.`
}

function buildFestivalRestockAnswer(
  summary: NonNullable<AnalyticsSummary['festivalSummary']>[number] | null,
  locale: Locale,
): string {
  if (!summary || summary.topProducts.length === 0) {
    return locale === 'bn'
      ? 'এই উৎসবের জন্য নির্ভরযোগ্য রিস্টক তথ্য পাওয়া যায়নি।'
      : 'No reliable festival restock candidates were found for this festival.'
  }

  const topRestock = [...summary.topProducts]
    .filter((item) => item.suggestedFestivalRestock > 0 || item.currentStock <= 0)
    .sort((a, b) => {
      if (b.suggestedFestivalRestock !== a.suggestedFestivalRestock) {
        return b.suggestedFestivalRestock - a.suggestedFestivalRestock
      }
      if (b.avgFestivalWindowQty !== a.avgFestivalWindowQty) {
        return b.avgFestivalWindowQty - a.avgFestivalWindowQty
      }
      return b.upliftPct - a.upliftPct
    })[0] ?? summary.topProducts[0]

  if (locale === 'bn') {
    return `${labelProduct(topRestock.name, locale)} ${labelFestival(summary.festival, locale)}-এর জন্য শক্তিশালী রিস্টক প্রার্থী। গড়ে প্রতি ${labelFestival(summary.festival, locale)} উইন্ডোতে ${formatUnits(topRestock.avgFestivalWindowQty, locale)} ইউনিট বিক্রি হয়েছে, স্বাভাবিক দিনে গড় ${topRestock.normalDailyQty.toFixed(1)} ইউনিট। আপলিফট ${formatUnits(topRestock.upliftPct, locale)}%। বর্তমান স্টক ${formatUnits(topRestock.currentStock, locale)}। প্রস্তাবিত রিস্টক ${formatUnits(topRestock.suggestedFestivalRestock, locale)} ইউনিট।`
  }

  return `${topRestock.name} is a strong restock candidate for ${summary.festival}. It averages ${formatUnits(topRestock.avgFestivalWindowQty, locale)} units per ${summary.festival} window versus ${topRestock.normalDailyQty.toFixed(1)} units on a normal day, an uplift of ${formatUnits(topRestock.upliftPct, locale)}%. Current stock is ${formatUnits(topRestock.currentStock, locale)} and suggested festival restock is ${formatUnits(topRestock.suggestedFestivalRestock, locale)} units.`
}

function buildFestivalProductAnswer(
  summary: NonNullable<AnalyticsSummary['festivalSummary']>[number] | null,
  product: Product | null,
  locale: Locale,
): string | null {
  if (!summary || !product) return null
  const match = summary.topProducts.find((item) => item.sku === product.sku || item.name === product.name)
  if (!match) {
    if (locale === 'bn') {
      return `${labelProduct(product.name, locale)}-এর জন্য ${labelFestival(summary.festival, locale)} সময়ের আলাদা বিক্রির রেকর্ড পাওয়া যায়নি।`
    }
    return `No separate ${summary.festival} sales record was found for ${product.name}.`
  }

  if (locale === 'bn') {
    return `${labelProduct(product.name, locale)} ${labelFestival(summary.festival, locale)}-এ ${formatUnits(match.qty, locale)} ইউনিট বিক্রি হয়েছে এবং আয় হয়েছে ৳${formatUnits(match.revenue, locale)}। গড়ে প্রতি উৎসব উইন্ডোতে ${formatUnits(match.avgFestivalWindowQty, locale)} ইউনিট বিক্রি হয়, স্বাভাবিক দিনের তুলনায় আপলিফট ${formatUnits(match.upliftPct, locale)}%। প্রয়োজন হলে ${formatUnits(match.suggestedFestivalRestock, locale)} ইউনিট রিস্টক করা যেতে পারে।`
  }
  return `${product.name} sold ${formatUnits(match.qty, locale)} units during ${summary.festival}, generating Tk ${formatUnits(match.revenue, locale)}. It averages ${formatUnits(match.avgFestivalWindowQty, locale)} units per festival window with ${formatUnits(match.upliftPct, locale)}% uplift over normal demand. Suggested festival restock is ${formatUnits(match.suggestedFestivalRestock, locale)} units.`
}

export function answerNlQuery(
  query: string,
  shop: ShopData,
  analytics: AnalyticsSummary,
  locale: Locale = 'en',
): { answerBn: string; intent: string; dataUsed: string[] } {
  const q = query.toLowerCase()
  const dataUsed: string[] = []
  const fmt = (n: number) =>
    locale === 'bn' ? Math.round(n).toLocaleString('bn-BD') : Math.round(n).toLocaleString()
  const product = findProductMatch(query, shop)
  const stockSubject = extractSpecificStockSubject(query)
  const festivalQuery = detectFestivalInQuery(query)

  if (q.includes('dead') || q.includes('slow') || q.includes('ডেড')) {
    dataUsed.push('deadStockCount', 'slowMovers')
    const slow = analytics.slowMovers
      .slice(0, 5)
      .map((s) => labelProduct(s.name, locale))
      .join(', ')
    return {
      intent: 'dead_stock',
      answerBn:
        locale === 'bn'
          ? `ডেড স্টক ঝুঁকি: ${analytics.deadStockCount}টি পণ্য। ধীর বিক্রয়: ${slow || 'তথ্য নেই'}। ছাড় বা বান্ডল বিবেচনা করুন।`
          : `Dead stock risk: ${analytics.deadStockCount} SKU(s). Slowest: ${slow || 'n/a'}. Consider discount or bundle.`,
      dataUsed,
    }
  }

  if (q.includes('best') || q.includes('top') || q.includes('সেরা')) {
    dataUsed.push('bestSeller', 'topMovers')
    return {
      intent: 'top_sellers',
      answerBn: analytics.bestSeller
        ? locale === 'bn'
          ? `সেরা বিক্রিত: ${labelProduct(analytics.bestSeller.name, locale)} (৳${fmt(analytics.bestSeller.revenue)}).`
          : `Best seller: ${analytics.bestSeller.name} (৳${fmt(analytics.bestSeller.revenue)}).`
        : locale === 'bn'
          ? 'সেরা বিক্রিত পণ্য শনাক্ত হয়নি।'
          : 'No best seller identified.',
      dataUsed,
    }
  }

  if (stockSubject && !isGenericInventorySubject(stockSubject)) {
    if (product) {
      return {
        intent: 'product_stock',
        answerBn: buildProductStockAnswer(product, locale),
        dataUsed: ['product.stockQty'],
      }
    }

    return {
      intent: 'product_not_found',
      answerBn: buildMissingProductAnswer(stockSubject, locale),
      dataUsed: ['products'],
    }
  }

  if (q.includes('stock') || q.includes('run out') || q.includes('স্টক')) {
    dataUsed.push('lowStockCount')
    return {
      intent: 'low_stock',
      answerBn:
        locale === 'bn'
          ? `${analytics.lowStockCount}টি পণ্যে ১৪ দিনের কম স্টক কভার - দ্রুত পুনরায় অর্ডার করুন।`
          : `${analytics.lowStockCount} SKU(s) under 14 days of stock cover - reorder soon.`,
      dataUsed,
    }
  }

  if (q.includes('profit') || q.includes('লাভ')) {
    dataUsed.push('profitEstimate')
    return {
      intent: 'profit',
      answerBn:
        locale === 'bn'
          ? `আনুমানিক লাভ (আয় - খরচ): ৳${fmt(analytics.profitEstimate)}।`
          : `Estimated profit (revenue - cost): ৳${fmt(analytics.profitEstimate)}.`,
      dataUsed,
    }
  }

  if (festivalQuery) {
    dataUsed.push('festivalLift', 'festivalSummary')
    const summary = findFestivalSummary(analytics, festivalQuery)

    if (product && matchesFestivalProductQuery(query)) {
      return {
        intent: 'festival_product',
        answerBn: buildFestivalProductAnswer(summary, product, locale) ?? buildFestivalSummaryAnswer(summary, locale),
        dataUsed,
      }
    }

    if (q.includes('restock') || q.includes('reorder') || q.includes('stock up') || q.includes('রিস্টক') || q.includes('অর্ডার')) {
      return {
        intent: 'festival_restock',
        answerBn: buildFestivalRestockAnswer(summary, locale),
        dataUsed,
      }
    }

    return {
      intent: 'festival',
      answerBn: buildFestivalSummaryAnswer(summary, locale),
      dataUsed,
    }
  }

  if (product) {
    dataUsed.push('productSalesTrend')
    const trend = productSalesTrend(product.name, shop.sales)
    const last = trend[trend.length - 1]
    const label = labelProduct(product.name, locale)
    return {
      intent: 'product_trend',
      answerBn: last
        ? locale === 'bn'
          ? `${label}: গত মাসে ৳${fmt(last.revenue)}, ${last.qty} ইউনিট। স্টক: ${product.stockQty}।`
          : `${label}: last month ৳${fmt(last.revenue)}, ${last.qty} units. Stock: ${product.stockQty}.`
        : locale === 'bn'
          ? `${label}-এর জন্য পর্যাপ্ত বিক্রয় ইতিহাস নেই।`
          : `Not enough sales history for ${label}.`,
      dataUsed,
    }
  }

  if (q.includes('why') || q.includes('কেন')) {
    return {
      intent: 'root_cause_hint',
      answerBn:
        locale === 'bn'
          ? '“বিক্রয় কেন পরিবর্তন হলো?” বিভাগে পণ্যের নাম লিখে বিশ্লেষণ করুন।'
          : 'Enter a product name in “Why did sales change?” for root-cause analysis.',
      dataUsed: [],
    }
  }

  dataUsed.push('totalRevenue', 'totalSkus')
  return {
    intent: 'summary',
    answerBn:
      locale === 'bn'
        ? `${analytics.totalSkus}টি পণ্য · মোট বিক্রয় ৳${fmt(analytics.totalRevenue)} · গত ৩০ দিন ৳${fmt(analytics.totalRevenue30d)}।`
        : `${analytics.totalSkus} SKUs · Total sales ৳${fmt(analytics.totalRevenue)} · Last 30d ৳${fmt(analytics.totalRevenue30d)}.`,
    dataUsed,
  }
}
