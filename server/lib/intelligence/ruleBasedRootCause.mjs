function parseTrend(context) {
  const m = String(context ?? '').match(/(?:Trend|প্রবণতা)\s*:\s*([^\n]+)/i)
  return m?.[1]?.trim() ?? ''
}

function parseStock(context) {
  const m = String(context ?? '').match(/(?:Current stock|বর্তমান স্টক)\s*:\s*(\d+)/i)
  return m ? Number(m[1]) : null
}

function parseMonthly(context) {
  const m = String(context ?? '').match(/(?:Monthly|মাসিক)\s*:\s*([^\n]+)/i)
  const line = m?.[1]?.trim() ?? ''
  if (!line) return []

  // Example: 2024-12: ৳123619, 2025-01: ৳1285694
  return line
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const mm = part.match(/(\d{4}-\d{2})\s*:\s*৳?([\d,]+)/)
      if (!mm) return null
      return { period: mm[1], revenue: Number(mm[2].replace(/,/g, '')) }
    })
    .filter(Boolean)
}

function parseFestivalSales(context) {
  const m = String(context ?? '').match(/(?:Festival sales|উৎসবে বিক্রয়)\s*:\s*([^\n]+)/i)
  const line = m?.[1]?.trim() ?? ''
  if (!line) return []
  if (/^N\/A$/i.test(line) || line === 'নেই') return []

  // Example: Ramadan=৳4366722, Pohela Boishakh=৳4354989
  return line
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const mm = part.match(/([^=]+)=\s*৳?([\d,]+)/)
      if (!mm) return null
      return { festival: mm[1].trim(), revenue: Number(mm[2].replace(/,/g, '')) }
    })
    .filter(Boolean)
}

function ratio(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  return a / b
}

function localizeFestivalName(name, locale) {
  if (locale !== 'bn') return name
  const n = String(name ?? '').trim().toLowerCase()
  if (!n) return name
  if (n === 'ramadan') return 'রমজান'
  if (n.includes('pohela') && n.includes('boishakh')) return 'পহেলা বৈশাখ'
  if (n === 'eid') return 'ঈদ'
  return name
}

export function ruleBasedRootCause({ productQuery = '', context = '', locale = 'en' }) {
  const trend = parseTrend(context)
  const stockQty = parseStock(context)
  const monthly = parseMonthly(context)
  const festivals = parseFestivalSales(context)

  const last = monthly.length ? monthly[monthly.length - 1] : null
  const first = monthly.length ? monthly[0] : null
  const peak = monthly.length
    ? monthly.reduce((best, cur) => (cur.revenue > best.revenue ? cur : best), monthly[0])
    : null

  const lastToFirst = first && last ? ratio(last.revenue, first.revenue) : null
  const isDeclining =
    /declin|কমছে/i.test(trend) ||
    (lastToFirst !== null && lastToFirst < 0.8) ||
    (monthly.length >= 2 && last.revenue < monthly[monthly.length - 2].revenue)

  const isRising =
    /rising|বাড়ছে|বৃদ্ধি/i.test(trend) ||
    (lastToFirst !== null && lastToFirst > 1.2)

  const stockThreshold = 100 // demo heuristic
  const stockLikelyIssue =
    stockQty === null
      ? null
      : stockQty < stockThreshold
        ? 'low_stock'
        : 'overstock'

  const causes = []
  const actions = []

  if (isDeclining) {
    causes.push(locale === 'bn' ? 'উৎসব-পুল শেষে সাধারণ চাহিদা কমে যাওয়া' : 'Post-festival demand drop')
    if (festivals.length) {
      const topFest = festivals.reduce((b, c) => (c.revenue > b.revenue ? c : b), festivals[0])
      causes.push(
        locale === 'bn'
          ? `উৎসবে বিক্রি বেশি ছিল (${localizeFestivalName(topFest.festival, locale)}), কিন্তু পরে কমেছে`
          : `Sales were high during ${topFest.festival}, then cooled down`,
      )
    }

    if (stockLikelyIssue === 'low_stock') {
      causes.push(locale === 'bn' ? 'স্টক কম থাকায় সম্ভাব্য ক্রেতা হারানো' : 'Lost sales due to low availability')
      actions.push(locale === 'bn' ? 'দ্রুত রিঅর্ডার/পুনরায় স্টক' : 'Reorder quickly')
    } else if (stockLikelyIssue === 'overstock') {
      causes.push(locale === 'bn' ? 'স্টক বেশি থাকায় স্লো-মুভার তৈরি হওয়া' : 'Slow-movers due to excess stock')
      actions.push(locale === 'bn' ? 'ডিসকাউন্ট/বান্ডেল চালান' : 'Run discount/bundles')
    } else {
      actions.push(locale === 'bn' ? 'সপ্তাহভিত্তিক স্টক + বিক্রয় মিলিয়ে দেখুন' : 'Align weekly stock vs sales')
    }

    actions.push(locale === 'bn' ? 'সর্বশেষ মাসের কম পারফর্ম করা সেগমেন্টে অফার দিন' : 'Offer on the last-month weak segments')
  } else if (isRising) {
    causes.push(locale === 'bn' ? 'চাহিদা বৃদ্ধি/মার্কেটের অনুকূল সময়' : 'Demand increase / favorable timing')
    if (festivals.length) {
      const topFest = festivals.reduce((b, c) => (c.revenue > b.revenue ? c : b), festivals[0])
      causes.push(locale === 'bn' ? `উৎসব মৌসুমে বিক্রি শক্তিশালী (${topFest.festival})` : `Strong festival momentum (${topFest.festival})`)
    }
    actions.push(locale === 'bn' ? 'স্টক-আউট এড়াতে সঠিক পরিমাণ স্টক রাখুন' : 'Avoid stockouts with proper inventory')
    actions.push(locale === 'bn' ? 'শীর্ষ চ্যানেল/ভ্যারিয়েন্টে ফোকাস বাড়ান' : 'Double down on top channels/variants')
  } else {
    causes.push(locale === 'bn' ? 'বিক্রি তুলনামূলক স্থিতিশীল (variance কম)' : 'Sales relatively stable')
    actions.push(locale === 'bn' ? 'মাসিক পারফরম্যান্স দেখে ছোট টেস্ট করুন' : 'Run small month-by-month tests')
    actions.push(locale === 'bn' ? 'স্টক রোটেশন অপ্টিমাইজ করুন' : 'Optimize stock rotation')
  }

  // Keep answer concise; do not echo the full raw context.
  // Avoid leaving the raw user query (e.g. "Shirt") inside Bangla sentences.
  const productText = locale === 'bn' ? 'এই পণ্যটির' : productQuery ? productQuery : 'product'
  let trendText = trend || (locale === 'bn' ? 'প্রবণতা' : 'trend')
  if (locale === 'bn') {
    if (/declin/i.test(trendText)) trendText = 'কমছে'
    if (/rising/i.test(trendText) || /rise/i.test(trendText)) trendText = 'বাড়ছে'
    if (/flat|flatness|stable/i.test(trendText)) trendText = 'স্থির'
  }

  const summaryBn =
    locale === 'bn'
      ? `${productText} বিক্রি ${trendText} দেখা যাচ্ছে। মূল কারণগুলো: ${causes.slice(0, 2).join(' ও ')}। করণীয়: ${actions.slice(0, 2).join(' এবং ')}।`
      : `${productText} shows a ${trendText} pattern. Likely causes: ${causes.slice(0, 2).join(' and ')}. Recommended actions: ${actions.slice(0, 2).join(' and ')}.`

  return { summaryBn, likelyCauses: causes.slice(0, 3), actions: actions.slice(0, 3) }
}

