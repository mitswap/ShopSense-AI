import { buildReasoningEnvelope, runReasoningTask } from '../lib/intelligence/runtime.mjs'

function getWeatherApiKey() {
  return process.env.WEATHER_API_KEY ?? '3e8a4b3e1e88438bb6c113746260506'
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
}

async function fetchCurrentWeather(city) {
  const key = getWeatherApiKey()
  const url = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(city)}&aqi=no`
  const res = await fetch(url)
  const text = await res.text()
  let data = {}

  if (text.trim()) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error('Weather provider returned invalid JSON')
    }
  }

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Weather API ${res.status}`)
  }

  return data
}

function scoreWeatherSensitiveProducts(products, forecasts, weather) {
  const text = String(weather?.current?.condition?.text ?? '').toLowerCase()
  const tempC = Number(weather?.current?.temp_c ?? 0)
  const precipMm = Number(weather?.current?.precip_mm ?? 0)
  const humidity = Number(weather?.current?.humidity ?? 0)
  const forecastBySku = new Map((forecasts ?? []).map((item) => [item.sku, item]))

  return (products ?? []).map((product) => {
    const hay = `${product.name} ${product.nameBn} ${product.category}`.toLowerCase()
    let score = 0

    if (tempC >= 31) {
      if (/(cotton|t-shirt|tee|summer|home wear|homewear|light|sando|polo)/i.test(hay)) score += 3
      if (/(hoodie|shawl|sweater|jacket|blazer|winter)/i.test(hay)) score -= 4
    }
    if (tempC <= 20) {
      if (/(hoodie|shawl|sweater|jacket|winter|full sleeve|cardigan)/i.test(hay)) score += 4
      if (/(cotton tee|sando|summer|linen)/i.test(hay)) score -= 2
    }
    if (precipMm > 0 || /rain|drizzle|storm|thunder/i.test(text)) {
      if (/(quick dry|legging|scarf|home wear|homewear|sandals|umbrella)/i.test(hay)) score += 3
      if (/(premium|party|formal|blazer|wedding|occasion)/i.test(hay)) score -= 3
    }
    if (humidity >= 75) {
      if (/(cotton|breathable|light|soft)/i.test(hay)) score += 2
      if (/(denim|heavy|thick)/i.test(hay)) score -= 2
    }

    const fc = forecastBySku.get(product.sku)
    if ((fc?.risk ?? 'low') === 'high') score += 1
    if ((fc?.avgDailySales ?? 0) >= 1.2) score += 1
    if (product.stockQty <= 0) score -= 5

    return { product, score }
  })
}

function buildDeterministicWeatherAdvice({ locale, weather, products, forecasts }) {
  const scored = scoreWeatherSensitiveProducts(products, forecasts, weather)
  const winners = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => (locale === 'bn' ? item.product.nameBn || item.product.name : item.product.name))

  const losers = scored
    .filter((item) => item.score < 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => (locale === 'bn' ? item.product.nameBn || item.product.name : item.product.name))

  const tempC = Number(weather?.current?.temp_c ?? 0)
  const precipMm = Number(weather?.current?.precip_mm ?? 0)
  const humidity = Number(weather?.current?.humidity ?? 0)
  const conditionText = String(weather?.current?.condition?.text ?? '')

  if (locale === 'bn') {
    const summaryParts = []
    if (precipMm > 0) summaryParts.push('আজ বৃষ্টি আছে, তাই হাঁটে আসা ক্রেতা কিছুটা কমতে পারে।')
    if (tempC >= 31) summaryParts.push('গরম বেশি, তাই হালকা ও আরামদায়ক পোশাক সামনে রাখুন।')
    if (tempC <= 20) summaryParts.push('তাপমাত্রা কম, তাই শীতের উপযোগী পণ্যের প্রদর্শন বাড়ান।')
    if (summaryParts.length === 0) summaryParts.push(`আজকের আবহাওয়া ${conditionText.toLowerCase()} ধরনের, তাই স্বাভাবিক বিক্রির সঙ্গে সামঞ্জস্য রেখে ডিসপ্লে সাজান।`)

    return {
      summary: summaryParts.join(' '),
      dailyLife: [
        precipMm > 0 ? 'ছাতা বা রেইন-প্রস্তুতি রাখুন, আজ যাতায়াতে সময় বেশি লাগতে পারে।' : 'আজ বাইরে বের হওয়া তুলনামূলক সহজ, তাই ডেলিভারি ও সরবরাহ ফলো-আপ সেরে নিতে পারেন।',
        tempC >= 31 ? 'গরমের কারণে স্টাফদের পানির ব্যবস্থা ও হালকা পোশাক নিশ্চিত করুন।' : 'আবহাওয়ার সঙ্গে মানিয়ে দোকানের সামনের অংশ পরিষ্কার ও আরামদায়ক রাখুন।',
      ],
      frontDeskWinners: winners.length > 0
        ? winners.map((name) => `${name} সামনে রাখুন, আজ এই পণ্যে চোখ থামার সম্ভাবনা বেশি।`)
        : ['আজকের আবহাওয়া নিরপেক্ষ, তাই আপনার বর্তমান বেস্টসেলারগুলো সামনে রাখুন।'],
      likelyLosers: losers.length > 0
        ? losers.map((name) => `${name} আজ ধীর হতে পারে। বেশি সামনে জায়গা না দিলেও চলবে।`)
        : ['আজকের আবহাওয়ায় স্পষ্ট কোনো দুর্বল পণ্য ধরা পড়েনি।'],
      shopActions: [
        winners.length > 0 ? `ফ্রন্ট ডেস্কে আগে তুলুন: ${winners.join(', ')}।` : 'আজ ফ্রন্ট ডেস্কে শীর্ষ বিক্রির পণ্যগুলো ধরে রাখুন।',
        losers.length > 0 ? `এই পণ্যগুলোর ডিসপ্লে পেছনে সরাতে পারেন: ${losers.join(', ')}।` : 'দুর্বল পণ্যের বদলে দ্রুত বিক্রির পণ্যে বেশি নজর দিন।',
        humidity >= 75 ? 'আর্দ্রতা বেশি, তাই কটন বা আরামদায়ক কাপড়ের পণ্য সামনে রাখলে ভালো সাড়া মিলতে পারে।' : 'দোকানের সামনের ডিসপ্লেতে পরিষ্কার, সহজে বেছে নেওয়া যায় এমন সেট রাখুন।',
      ],
    }
  }

  const summaryParts = []
  if (precipMm > 0) summaryParts.push('Rain is likely to reduce casual walk-in traffic today.')
  if (tempC >= 31) summaryParts.push('Hot weather favors light, breathable apparel.')
  if (tempC <= 20) summaryParts.push('Cooler weather supports winter and layering products.')
  if (summaryParts.length === 0) summaryParts.push(`Today looks ${conditionText.toLowerCase()}, so keep displays aligned with normal buying patterns.`)

  return {
    summary: summaryParts.join(' '),
    dailyLife: [
      precipMm > 0 ? 'Keep an umbrella and allow extra travel time for supply follow-ups.' : 'Today is suitable for store visits, supplier calls, and routine follow-up work.',
      tempC >= 31 ? 'Keep water and a cooler front area ready for staff and customers.' : 'Maintain a clean, comfortable front area to help customers browse longer.',
    ],
    frontDeskWinners: winners.length > 0
      ? winners.map((name) => `Move ${name} to the front desk display today.`)
      : ['Front-load your current bestsellers today.'],
    likelyLosers: losers.length > 0
      ? losers.map((name) => `${name} is likely to be slower today.`)
      : ['No strong weather loser stands out today.'],
    shopActions: [
      winners.length > 0 ? `Lead with ${winners.join(', ')} in your front display.` : 'Use your best-moving SKUs in the front display.',
      losers.length > 0 ? `Reduce front space for ${losers.join(', ')}.` : 'Keep weaker categories behind your hero products.',
      humidity >= 75 ? 'High humidity favors breathable and comfort-focused apparel.' : 'Use simple, quick-decision displays near the entrance.',
    ],
  }
}

function buildWeatherPrompt({ locale, city, weather, products, forecasts, deterministicAdvice }) {
  return `${locale === 'bn' ? 'সব উত্তর বাংলা লিপিতে দিন।' : 'Return all user-facing text in English.'}

You are ShopSense AI generating grounded weather-based retail guidance.
Use only the provided weather, forecast, inventory, and deterministic candidate advice.
Do not invent temperature, inventory, or demand values.

City: ${city}
Weather:
${JSON.stringify(weather, null, 2)}

Forecast/product evidence:
${JSON.stringify(
    {
      forecasts: (forecasts ?? []).slice(0, 8),
      products: (products ?? []).slice(0, 8),
    },
    null,
    2,
  )}

Deterministic candidate advice:
${JSON.stringify(deterministicAdvice, null, 2)}

Return valid JSON only:
{"summary":"short summary","dailyLife":["a","b"],"frontDeskWinners":["a"],"likelyLosers":["a"],"shopActions":["a","b"],"confidence":0.82}`
}

export async function handleWeatherAdvice(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = parseBody(req)
  const { city, locale = 'en', products = [], forecasts = [] } = body ?? {}
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'city required' })
  }

  try {
    const weather = await fetchCurrentWeather(city)
    const deterministicAdvice = buildDeterministicWeatherAdvice({
      locale,
      weather,
      products,
      forecasts,
    })

    const evidenceUsed = ['weather.current', 'forecasts', 'products']
    const runtime = await runReasoningTask({
      taskType: 'weather_reasoning',
      prompt: buildWeatherPrompt({ locale, city, weather, products, forecasts, deterministicAdvice }),
      evidence: evidenceUsed,
      guards: {
        requiredStringFields: ['summary'],
        requiredArrayFields: ['dailyLife', 'frontDeskWinners', 'likelyLosers', 'shopActions'],
      },
      fallback: () => ({
        provider: 'deterministic',
        parsed: deterministicAdvice,
        confidence: 0.74,
        evidenceUsed,
      }),
      reasoningPath: ['task:weather_reasoning'],
    })

    const parsed = runtime.parsed ?? deterministicAdvice
    return res.status(200).json({
      location: {
        name: weather.location?.name ?? city,
        region: weather.location?.region ?? '',
        country: weather.location?.country ?? '',
        localtime: weather.location?.localtime ?? '',
      },
      current: {
        tempC: Number(weather.current?.temp_c ?? 0),
        feelsLikeC: Number(weather.current?.feelslike_c ?? 0),
        humidity: Number(weather.current?.humidity ?? 0),
        windKph: Number(weather.current?.wind_kph ?? 0),
        precipMm: Number(weather.current?.precip_mm ?? 0),
        uv: Number(weather.current?.uv ?? 0),
        isDay: Number(weather.current?.is_day ?? 1),
        conditionText: weather.current?.condition?.text ?? '',
        conditionIcon: weather.current?.condition?.icon ? `https:${weather.current.condition.icon}` : '',
      },
      advice: {
        summary: parsed.summary ?? deterministicAdvice.summary,
        dailyLife: parsed.dailyLife ?? deterministicAdvice.dailyLife,
        frontDeskWinners: parsed.frontDeskWinners ?? deterministicAdvice.frontDeskWinners,
        likelyLosers: parsed.likelyLosers ?? deterministicAdvice.likelyLosers,
        shopActions: parsed.shopActions ?? deterministicAdvice.shopActions,
      },
      ...buildReasoningEnvelope({
        provider: runtime.provider,
        reasoningPath: runtime.reasoningPath,
        evidenceUsed: runtime.evidenceUsed,
        confidence: runtime.confidence,
        ragMode: 'none',
        validation: runtime.validation,
        attempts: runtime.attempts,
        fallbackDepth: runtime.fallbackDepth,
        latencyMs: runtime.latencyMs,
      }),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message ?? 'Weather lookup failed' })
  }
}
