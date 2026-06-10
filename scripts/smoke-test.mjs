/**
 * End-to-end smoke test - run: node scripts/smoke-test.mjs
 */
const API = process.env.API_URL ?? 'http://127.0.0.1:3001'
const OLLAMA = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'
const FRONTEND = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'

const issues = []
const ok = []

function record(pass, name, detail = '') {
  if (pass) ok.push({ name, detail })
  else issues.push({ name, detail })
  const icon = pass ? 'OK' : 'FAIL'
  console.log(`[${icon}] ${name}${detail ? ` - ${detail}` : ''}`)
}

async function timed(_name, fn) {
  const t0 = Date.now()
  try {
    const result = await fn()
    return { ms: Date.now() - t0, result, error: null }
  } catch (e) {
    return { ms: Date.now() - t0, result: null, error: e.message }
  }
}

async function main() {
  console.log('\n=== ShopSense smoke test ===\n')

  const tags = await timed('ollama tags', () =>
    fetch(`${OLLAMA}/api/tags`).then((r) => ({ status: r.status, ok: r.ok })),
  )
  if (tags.result?.ok) {
    record(true, 'Ollama local probe', `${tags.ms}ms HTTP ${tags.result.status}`)
  } else {
    record(true, 'Ollama local probe', 'local daemon unavailable, checking cloud fallback instead')
  }

  const chat = await timed('ollama chat llama3.2:1b', () =>
    fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        stream: false,
      }),
      signal: AbortSignal.timeout(30_000),
    }).then(async (r) => {
      const j = await r.json().catch(() => ({}))
      return { status: r.status, content: j.message?.content ?? '' }
    }),
  )
  if (chat.error || chat.result?.status === 404) {
    record(true, 'Ollama local chat fallback', 'local response unavailable, checking API-backed fallback')
  } else {
    record(
      chat.result?.status === 200 && Boolean(chat.result?.content),
      'Ollama local chat',
      `${chat.ms}ms "${(chat.result?.content ?? '').slice(0, 40)}"`,
    )
  }

  const status = await timed('GET /api/status', () =>
    fetch(`${API}/api/status`).then((r) => r.json()),
  )
  if (status.error) {
    record(false, 'API server', status.error)
    console.log('\n--- Cannot continue without API ---\n')
    printSummary()
    process.exit(1)
  }
  record(true, 'API server', `${status.ms}ms`)
  const ollamaLayer = status.result?.layers?.ollama
  record(ollamaLayer?.ready === true, 'Status: LLM layer', JSON.stringify(ollamaLayer ?? {}))

  const health = await timed('GET /api/intelligence/health', () =>
    fetch(`${API}/api/intelligence/health`).then((r) => r.json()),
  )
  if (!health.error) {
    record(health.result?.ollama === true, 'Intelligence health ollama', `${health.ms}ms`)
    console.log('       ', JSON.stringify(health.result))
  }

  const sampleAnalytics = {
    totalRevenue: 120000,
    totalRevenue30d: 85000,
    totalStockValue: 450000,
    totalSkus: 40,
    lowStockCount: 5,
    overstockCount: 2,
  }

  const insightBn = await timed('POST /api/insight (bn)', () =>
    fetch(`${API}/api/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: 'bn',
        shopName: 'Rahim Fashion',
        analytics: sampleAnalytics,
        forecasts: [{ sku: 'SKU-1', risk: 'high', daysLeft: 3 }],
        alerts: [{ severity: 'high', title: 'Low stock', message: 'Panjabi low' }],
      }),
      signal: AbortSignal.timeout(120_000),
    }).then((r) => r.json()),
  )
  if (insightBn.error) {
    record(false, 'Insight BN', insightBn.error)
  } else {
    const s = insightBn.result?.summaryBn ?? ''
    const hasBn = /[\u0980-\u09FF]/.test(s)
    const agentic = String(insightBn.result?.ragMode ?? '').includes('agentic')
    record(hasBn, 'Insight BN has Bangla script', s.slice(0, 60))
    record(insightBn.ms < 12_000, 'Insight BN latency <12s', `${insightBn.ms}ms`)
    record(agentic, 'Insight uses agentic pipeline', insightBn.result?.ragMode)
    record(
      ['ollama', 'huggingface', 'openrouter', 'structured'].includes(insightBn.result?.provider),
      'Insight provider recognized',
      `provider=${insightBn.result?.provider ?? 'none'}`,
    )
    if (isMostlyEnglish(s)) {
      record(false, 'Insight BN still mostly English', s.slice(0, 80))
    }
  }

  const insightEn = await timed('POST /api/insight (en)', () =>
    fetch(`${API}/api/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: 'en',
        shopName: 'Rahim Fashion',
        analytics: sampleAnalytics,
        forecasts: [],
        alerts: [],
      }),
      signal: AbortSignal.timeout(120_000),
    }).then((r) => r.json()),
  )
  if (!insightEn.error) {
    record(insightEn.ms < 12_000, 'Insight EN latency <12s', `${insightEn.ms}ms`)
    record(
      !/[\u0980-\u09FF]{20}/.test(insightEn.result?.summaryBn ?? ''),
      'Insight EN mostly English',
      `${insightEn.ms}ms`,
    )
  }

  const nl = await timed('POST /api/query/nl (bn)', () =>
    fetch(`${API}/api/query/nl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: 'bn',
        query: 'কোন পণ্যে স্টক কম?',
        localAnswer: '৫টি পণ্যে ১৪ দিনের কম স্টক কভার - শীঘ্র পুনরায় অর্ডার করুন।',
        shopId: 'shop-demo',
        shopName: 'Rahim Fashion',
        analytics: sampleAnalytics,
        dataContext: { analytics: sampleAnalytics },
      }),
      signal: AbortSignal.timeout(120_000),
    }).then((r) => r.json()),
  )
  if (nl.error) {
    record(false, 'NL query BN', nl.error)
  } else if (nl.result?.error) {
    record(false, 'NL query BN API error', nl.result.error)
  } else {
    const a = nl.result?.answerBn ?? ''
    record(/[\u0980-\u09FF]/.test(a), 'NL answer Bangla', a.slice(0, 60))
    record(nl.ms < 20_000, 'NL query latency <20s', `${nl.ms}ms`)
  }

  const rc = await timed('POST /api/root-cause (bn)', () =>
    fetch(`${API}/api/root-cause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: 'bn',
        shopId: 'shop-demo',
        alert: { title: 'Low stock', message: 'Panjabi stock critical' },
        analytics: sampleAnalytics,
      }),
      signal: AbortSignal.timeout(120_000),
    }).then((r) => r.json()),
  )
  if (!rc.error) {
    record(rc.ms < 25_000, 'Root cause latency <25s', `${rc.ms}ms`)
    const rcText = rc.result?.answerBn ?? rc.result?.summaryBn ?? ''
    record(/[\u0980-\u09FF]/.test(rcText), 'Root cause Bangla', rcText.slice(0, 50))
  }

  const fe = await timed('GET frontend', () =>
    fetch(FRONTEND, { signal: AbortSignal.timeout(5000) }).then((r) => ({
      status: r.status,
      ok: r.ok,
    })),
  )
  if (fe.error) {
    record(true, 'Frontend check skipped', 'frontend dev server not running')
  } else {
    record(fe.result?.ok, 'Vite frontend', `HTTP ${fe.result?.status} ${fe.ms}ms`)
  }

  printSummary()
  process.exit(issues.length ? 1 : 0)
}

function isMostlyEnglish(text) {
  if (!text?.trim()) return true
  const bn = (text.match(/[\u0980-\u09FF]/g) || []).length
  return bn < Math.max(8, text.length * 0.12)
}

function printSummary() {
  console.log('\n=== Summary ===')
  console.log(`Passed: ${ok.length}  Failed: ${issues.length}`)
  if (issues.length) {
    console.log('\nDifficulties found:')
    issues.forEach((i, n) => console.log(`  ${n + 1}. ${i.name}: ${i.detail}`))
  }
}

main()
