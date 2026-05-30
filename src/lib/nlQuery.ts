import type { Locale } from './i18n'
import { labelFestival, labelProduct } from './localeCopy'
import type { AnalyticsSummary, ShopData } from '../types'
import { productSalesTrend } from './analyticsEngine'

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
          ? `ডেড স্টক ঝুঁকি: ${analytics.deadStockCount}টি পণ্য। ধীর বিক্রয়: ${slow || 'তথ্য নেই'}। ছাড় বা বান্ডল বিবেচনা করুন।`
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
          ? 'সেরা বিক্রিত পণ্য শনাক্ত হয়নি।'
          : 'No best seller identified.',
      dataUsed,
    }
  }

  if (q.includes('stock') || q.includes('run out') || q.includes('স্টক')) {
    dataUsed.push('lowStockCount')
    return {
      intent: 'low_stock',
      answerBn:
        locale === 'bn'
          ? `${analytics.lowStockCount}টি পণ্যে ১৪ দিনের কম স্টক কভার — শীঘ্র পুনরায় অর্ডার করুন।`
          : `${analytics.lowStockCount} SKU(s) under 14 days of stock cover — reorder soon.`,
      dataUsed,
    }
  }

  if (q.includes('profit') || q.includes('লাভ')) {
    dataUsed.push('profitEstimate')
    return {
      intent: 'profit',
      answerBn:
        locale === 'bn'
          ? `আনুমানিক লাভ (আয় − খরচ): ৳${fmt(analytics.profitEstimate)}।`
          : `Estimated profit (revenue − cost): ৳${fmt(analytics.profitEstimate)}.`,
      dataUsed,
    }
  }

  if (q.includes('eid') || q.includes('festival') || q.includes('উৎসব') || q.includes('ঈদ')) {
    dataUsed.push('festivalLift')
    const top = analytics.festivalLift[0]
    return {
      intent: 'festival',
      answerBn: top
        ? locale === 'bn'
          ? `${labelFestival(top.festival, locale)}: ৳${fmt(top.revenue)} আয় — চূড়ান্ত সময়ের আগে স্টক বাড়ান।`
          : `${top.festival}: ৳${fmt(top.revenue)} revenue — stock up before peak.`
        : locale === 'bn'
          ? 'ফাইলে উৎসবের তথ্য নেই।'
          : 'No festival data in file.',
      dataUsed,
    }
  }

  const product = shop.products.find(
    (p) =>
      q.includes(p.name.toLowerCase()) ||
      q.includes(p.category.toLowerCase()) ||
      q.includes(labelProduct(p.name, 'bn').toLowerCase()),
  )
  if (product) {
    dataUsed.push('productSalesTrend')
    const trend = productSalesTrend(product.name, shop.sales)
    const last = trend[trend.length - 1]
    const p = labelProduct(product.name, locale)
    return {
      intent: 'product_trend',
      answerBn: last
        ? locale === 'bn'
          ? `${p}: গত মাসে ৳${fmt(last.revenue)}, ${last.qty} ইউনিট। স্টক: ${product.stockQty}।`
          : `${p}: last month ৳${fmt(last.revenue)}, ${last.qty} units. Stock: ${product.stockQty}.`
        : locale === 'bn'
          ? `${p}-এর জন্য পর্যাপ্ত বিক্রয় ইতিহাস নেই।`
          : `Not enough sales history for ${p}.`,
      dataUsed,
    }
  }

  if (q.includes('why') || q.includes('কেন')) {
    return {
      intent: 'root_cause_hint',
      answerBn:
        locale === 'bn'
          ? '“বিক্রয় কেন পরিবর্তন হলো?” বিভাগে পণ্যের নাম লিখে বিশ্লেষণ করুন।'
          : 'Enter a product name in “Why did sales change?” for root-cause analysis.',
      dataUsed: [],
    }
  }

  dataUsed.push('totalRevenue', 'totalSkus')
  return {
    intent: 'summary',
    answerBn:
      locale === 'bn'
        ? `${analytics.totalSkus}টি পণ্য · মোট বিক্রয় ৳${fmt(analytics.totalRevenue)} · গত ৩০ দিন ৳${fmt(analytics.totalRevenue30d)}।`
        : `${analytics.totalSkus} SKUs · Total sales ৳${fmt(analytics.totalRevenue)} · Last 30d ৳${fmt(analytics.totalRevenue30d)}.`,
    dataUsed,
  }
}
