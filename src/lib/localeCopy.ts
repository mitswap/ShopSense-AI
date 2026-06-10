import type { Locale } from './i18n-types'

/** Common retail labels from CSV so product names stay readable in Bangla mode. */
const PRODUCT_BN: Record<string, string> = {
  punjabi: 'পাঞ্জাবি',
  panjabi: 'পাঞ্জাবি',
  payjama: 'পায়জামা',
  pajama: 'পায়জামা',
  kurta: 'কুর্তা',
  kurti: 'কুর্তি',
  shirt: 'শার্ট',
  'formal shirt': 'ফরমাল শার্ট',
  't-shirt': 'টি-শার্ট',
  tshirt: 'টি-শার্ট',
  jeans: 'জিন্স',
  trouser: 'ট্রাউজার',
  pant: 'প্যান্ট',
  blazer: 'ব্লেজার',
  jacket: 'জ্যাকেট',
  saree: 'শাড়ি',
  sari: 'শাড়ি',
  koti: 'কোটি',
  hoodie: 'হুডি',
  sweater: 'সোয়েটার',
  loafer: 'লোফার',
  'half loafer': 'হাফ লোফার',
  top: 'টপ',
  shawl: 'শাল',
  set: 'সেট',
  festive: 'উৎসবের',
  premium: 'প্রিমিয়াম',
  formal: 'ফরমাল',
  casual: 'ক্যাজুয়াল',
  kids: 'শিশু',
}

const CATEGORY_BN: Record<string, string> = {
  eid: 'ঈদ',
  puja: 'পূজা',
  casual: 'ক্যাজুয়াল',
  formal: 'ফরমাল',
  winter: 'শীত',
  summer: 'গ্রীষ্ম',
  kids: 'শিশু',
  general: 'সাধারণ',
  ethnic: 'এথনিক',
  traditional: 'ট্র্যাডিশনাল',
  denim: 'ডেনিম',
}

const FESTIVAL_BN: Record<string, string> = {
  eid: 'ঈদ',
  'eid-ul-fitr': 'ঈদুল ফিতর',
  puja: 'পূজা',
  'durga puja': 'দুর্গা পূজা',
  none: 'নেই',
}

const DAY_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function replaceMappedTerms(input: string, dictionary: Record<string, string>): string {
  let output = input
  for (const [en, bn] of Object.entries(dictionary)) {
    output = output.replace(new RegExp(en, 'ig'), bn)
  }
  return output
}

export function labelProduct(name: string, locale: Locale): string {
  if (locale === 'en') return name
  const key = name.toLowerCase().trim()
  if (PRODUCT_BN[key]) return PRODUCT_BN[key]
  return replaceMappedTerms(name, PRODUCT_BN)
}

export function labelCategory(category: string, locale: Locale): string {
  if (locale === 'en') return category
  const key = category.toLowerCase().trim()
  if (CATEGORY_BN[key]) return CATEGORY_BN[key]
  return replaceMappedTerms(category, CATEGORY_BN)
}

export function labelFestival(festival: string, locale: Locale): string {
  if (locale === 'en') return festival
  return FESTIVAL_BN[festival.toLowerCase().trim()] ?? festival
}

export function weekdayName(index: number, locale: Locale): string {
  return locale === 'bn' ? (DAY_BN[index] ?? DAY_EN[index]) : (DAY_EN[index] ?? '')
}

export function labelRisk(risk: 'low' | 'medium' | 'high', locale: Locale): string {
  if (locale === 'en') return risk
  return { low: 'নিম্ন', medium: 'মধ্যম', high: 'উচ্চ' }[risk]
}

export function alertStockout(
  locale: Locale,
  name: string,
  days: number,
  reorder: number,
): string {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? `${p}: প্রায় ${days} দিনের মধ্যে স্টক শেষ হবে — ${reorder} পিস পুনরায় অর্ডার করুন।`
    : `${p}: ~${days} days until stock-out — reorder ${reorder} units.`
}

export function alertReorderSoon(
  locale: Locale,
  name: string,
  reorder: number,
): string {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? `${p}: ১৪ দিনের মধ্যে স্টক কমে যেতে পারে — ${reorder} পিস অর্ডার করুন।`
    : `${p}: stock may run low within 14 days — reorder ${reorder} units.`
}

export function alertSlowMover(locale: Locale, name: string, stock: number): string {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? `${p}: ধীর বিক্রয় — ${stock} পিস আছে; ছাড় বা বান্ডল বিবেচনা করুন।`
    : `${p}: slow mover — ${stock} units; consider discount or bundle.`
}

export function insightSalesGrowth(locale: Locale, pct: number, revenue30d: number): {
  title: string
  body: string
} {
  const dirBn = pct >= 0 ? 'বৃদ্ধি' : 'হ্রাস'
  const dirEn = pct >= 0 ? 'up' : 'down'
  return locale === 'bn'
    ? {
        title: `বিক্রয় ${dirBn} (${Math.abs(pct).toFixed(1)}%)`,
        body: `গত ৩০ দিন বনাম আগের ৩০ দিন। আয় ৳${Math.round(revenue30d).toLocaleString('bn-BD')}।`,
      }
    : {
        title: `Sales ${dirEn} (${Math.abs(pct).toFixed(1)}%)`,
        body: `Last 30 days vs prior 30 days. Revenue ৳${Math.round(revenue30d).toLocaleString()}.`,
      }
}

export function insightBestSeller(
  locale: Locale,
  name: string,
  revenue: number,
): { title: string; body: string } {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? {
        title: `সেরা বিক্রিত: ${p}`,
        body: `মোট আয় ৳${Math.round(revenue).toLocaleString('bn-BD')}।`,
      }
    : {
        title: `Best seller: ${p}`,
        body: `Total revenue ৳${Math.round(revenue).toLocaleString()}.`,
      }
}

export function insightFestivalLift(
  locale: Locale,
  festival: string,
  revenue: number,
): { title: string; body: string } {
  const f = labelFestival(festival, locale)
  return locale === 'bn'
    ? {
        title: `${f} বিক্রয় বাড়ায়`,
        body: `উৎসবকালীন আয় ৳${Math.round(revenue).toLocaleString('bn-BD')}। চূড়ান্ত সময়ের আগে স্টক বাড়ান।`,
      }
    : {
        title: `${f} drives sales`,
        body: `Festival-period revenue ৳${Math.round(revenue).toLocaleString()}. Increase stock before peak.`,
      }
}

export function insightFridaySpike(
  locale: Locale,
  pct: string,
): { title: string; body: string } {
  return locale === 'bn'
    ? {
        title: 'শুক্রবারে বিক্রয় বেশি',
        body: `শুক্রবারের গড় বিক্রয় অন্য দিনের চেয়ে ~${pct}% বেশি — শুক্রবারের আগে স্টক ও স্টাফ ঠিক রাখুন।`,
      }
    : {
        title: 'Friday sales spike',
        body: `Friday avg ~${pct}% above other days — staff and stock before Friday.`,
      }
}

export function insightStockoutRisk(
  locale: Locale,
  name: string,
  days: number | null,
  avgDaily: number,
  reorder: number,
): { title: string; body: string } {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? {
        title: `${p}: স্টক শেষের ঝুঁকি`,
        body: `প্রায় ${days ?? '?'} দিন স্টক বাকি। গড় ${avgDaily}/দিন। ~${reorder} পিস অর্ডার করুন।`,
      }
    : {
        title: `${p}: stock-out risk`,
        body: `~${days ?? '?'} days of stock left. Avg ${avgDaily}/day. Reorder ~${reorder} units.`,
      }
}

export function insightDeadStock(
  locale: Locale,
  name: string,
  stock: number,
): { title: string; body: string } {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? {
        title: `ডেড স্টক: ${p}`,
        body: `${stock} পিস স্টকে আছে কিন্তু বিক্রি খুব কম — ছাড় বা বান্ডল করুন।`,
      }
    : {
        title: `Dead stock: ${p}`,
        body: `${stock} units on hand but very slow sales — discount or bundle.`,
      }
}

export function feedStockout(
  locale: Locale,
  name: string,
  days: number | null,
  reorder: number,
): { title: string; body: string; action: string } {
  const p = labelProduct(name, locale)
  return locale === 'bn'
    ? {
        title: `${p}: স্টক শেষের ঝুঁকি`,
        body: `প্রায় ${days ?? '?'} দিন বাকি। উৎসবের চাহিদার আগে ${reorder} পিস অর্ডার করুন।`,
        action: `${reorder} পিস পুনরায় অর্ডারের পরিকল্পনা করুন`,
      }
    : {
        title: `${p}: stock-out risk`,
        body: `~${days} days left. Reorder ${reorder} units before festival demand.`,
        action: `Plan reorder of ${reorder} units`,
      }
}

export function feedBundle(
  locale: Locale,
  products: string[],
): { title: string; body: string; action: string } {
  const names = products.map((n) => labelProduct(n, locale)).join(' + ')
  return locale === 'bn'
    ? {
        title: 'বান্ডল সুযোগ',
        body: 'একসাথে বিক্রি হয় এমন পণ্য — বান্ডল অফার দিন।',
        action: `${names} বান্ডল করুন`,
      }
    : {
        title: 'Bundle opportunity',
        body: 'Products often sold together — offer a bundle.',
        action: `Bundle ${names}`,
      }
}

export function feedDeadStock(locale: Locale, count: number): {
  title: string
  body: string
  action: string
} {
  return locale === 'bn'
    ? {
        title: 'ডেড স্টক শনাক্ত',
        body: `${count}টি পণ্যে স্টক বেশি কিন্তু বিক্রি কম — নগদ আটকে আছে।`,
        action: '১০-১৫% ছাড় বা ক্রস-সেল চালান',
      }
    : {
        title: 'Dead stock detected',
        body: `${count} SKU(s) with high stock and low sales — cash tied up.`,
        action: 'Run 10-15% discount or cross-sell',
      }
}

export function graphBundleReason(locale: Locale, count: number): string {
  return locale === 'bn'
    ? `${count} দিন একসাথে বিক্রি হয়েছে — বান্ডল অফার বিবেচনা করুন।`
    : `Sold together on ${count} days — consider a bundle offer.`
}

export function graphMeta(
  locale: Locale,
  products: number,
  festivals: number,
  relations: number,
): string {
  return locale === 'bn'
    ? `${products}টি পণ্য · ${festivals}টি উৎসব সংযোগ · ${relations}টি সম্পর্ক`
    : `${products} products · ${festivals} festival links · ${relations} relations`
}
