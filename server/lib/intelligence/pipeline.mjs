import { hybridRetrieve } from '../rag/retrieval.mjs'
import { orchestrateQuery } from '../agents/orchestrator.mjs'
import { appendSessionQuery } from '../rag/sessionStore.mjs'
import { buildStructuredAdvice } from './structuredAdvice.mjs'

export async function runInsightPipeline(supabase, body) {
  const {
    shopName,
    analytics,
    forecasts,
    alerts,
    locale = 'bn',
    decisionFeed,
    graph,
    graphContext,
    shopId,
    sessionId,
    daysFilter = 30,
    products,
    sales,
    adviceSeed,
  } = body

  const query =
    locale === 'bn'
      ? 'SME দোকান স্টক বিক্রয় ঈদ বাংলাদেশ'
      : 'SME shop stock sales forecast'

  const orchestration = await orchestrateQuery(query, {
    analytics,
    forecasts,
    alerts,
    dataContext: body.dataContext,
    graph,
    decisionFeed,
  })

  const { ragMode, sources } = await hybridRetrieve(supabase, {
    query,
    locale,
    shopId: shopId ?? shopName,
    days: daysFilter,
    limit: 4,
  })

  const parsed = buildStructuredAdvice({
    shopName,
    analytics,
    forecasts,
    products: products ?? body.dataContext?.products,
    sales: sales ?? body.dataContext?.sales,
    graph: graph ?? body.dataContext?.graph,
    locale,
    adviceSeed: adviceSeed ?? Date.now(),
  })

  const response = {
    summaryBn: parsed.summaryBn,
    recommendations: parsed.recommendations,
    ragSources: sources?.length ? sources : [],
    ragMode: `${ragMode}+structured`,
    provider: 'structured',
    intent: orchestration.intent,
    adviceVariant: parsed.adviceVariant,
  }

  const firstAction = parsed.recommendations[0]?.actionBn ?? ''
  appendSessionQuery(shopId ?? shopName, sessionId, 'owner insight', firstAction)
  return response
}

import { buildContext } from '../rag/contextBuilder.mjs'
import { generateText } from '../llm/llmRouter.mjs'
import {
  ensureAnswerBengali,
  translateText,
  isMostlyEnglish,
} from '../agents/translationAgent.mjs'
import { ruleBasedRootCause } from './ruleBasedRootCause.mjs'

function parseInsightJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function localeInstruction(locale) {
  if (locale === 'bn') {
    return `CRITICAL: Write ALL user-facing text in Bengali (Bangla script only — বাংলা).`
  }
  return 'Write all user-facing text in clear English.'
}

function compactShopMetrics(shopName, analytics) {
  return `Shop: ${shopName}
30d revenue: ${analytics?.totalRevenue30d ?? analytics?.totalRevenue ?? 0}
SKUs: ${analytics?.totalSkus ?? 0}
Low stock: ${analytics?.lowStockCount ?? 0}
Overstock: ${analytics?.overstockCount ?? 0}
Dead stock: ${analytics?.deadStockCount ?? 0}`
}

export async function runNlQueryPipeline(supabase, body) {
  const {
    question,
    localAnswer,
    dataContext,
    locale = 'bn',
    shopId,
    sessionId,
    analytics,
    forecasts,
    alerts,
    shopName = 'Shop',
    daysFilter = 30,
  } = body

  const orchestration = await orchestrateQuery(question, {
    analytics: analytics ?? dataContext?.analytics,
    forecasts,
    alerts,
    dataContext,
  })

  const ragQuery = question

  const { chunks, ragMode, sources } = await hybridRetrieve(supabase, {
    query: ragQuery,
    locale,
    shopId,
    days: daysFilter,
    limit: 3,
  })

  const context = buildContext({
    shopName,
    analytics: analytics ?? dataContext?.analytics,
    forecasts,
    alerts,
    locale,
    shopId,
    sessionId,
    ragChunks: chunks,
    daysFilter,
  })

  const agentBlock = orchestration.agentOutputs
    .map((a) => `### ${a.agent}\n${a.summary}`)
    .join('\n\n')

  const dataSnippet = dataContext
    ? JSON.stringify(dataContext).slice(0, 2500)
    : 'No structured data passed.'

  const prompt = `Answer the shop owner. ${localeInstruction(locale)}

Question: ${question}

${context}

Data: ${dataSnippet}

Agents: ${agentBlock}

JSON: {"answerBn":"under 80 words","intent":"${orchestration.intent}","dataUsed":["field1"]}`

  const enrichMs = Number(process.env.OLLAMA_NL_ENRICH_MS ?? 6_000)
  let parsed = null
  let provider = 'local'

  try {
    const gen = await Promise.race([
      generateText(prompt, { maxTokens: 200, json: true, timeoutMs: enrichMs }),
      new Promise((resolve) =>
        setTimeout(() => resolve({ text: '', provider: 'timeout' }), enrichMs),
      ),
    ])
    parsed = parseInsightJson(gen.text)
    if (parsed?.answerBn) {
      provider =
        gen.provider === 'ollama' || gen.provider === 'huggingface'
          ? gen.provider
          : 'local'
    }
  } catch {
    /* use local */
  }

  if (!parsed?.answerBn) {
    parsed = {
      answerBn:
        localAnswer ||
        (locale === 'bn' ? 'এই প্রশ্নের জন্য ডেটা দেখে উত্তর পাওয়া যায়নি।' : 'No answer from data.'),
      intent: orchestration.intent,
      dataUsed: ['analytics'],
    }
    provider = localAnswer ? 'local' : provider
  }

  parsed.answerBn = await ensureAnswerBengali(parsed.answerBn, locale)
  if (locale === 'en') {
    parsed.answerBn = await translateText(parsed.answerBn, 'en')
  }

  appendSessionQuery(shopId, sessionId, question, parsed.answerBn)

  return {
    answerBn: parsed.answerBn,
    intent: parsed.intent ?? orchestration.intent,
    dataUsed: parsed.dataUsed ?? [],
    ragSources: sources,
    ragMode: `${ragMode}+agentic`,
    provider,
  }
}

export async function runRootCausePipeline(supabase, body) {
  const { alert, analytics, locale = 'bn', shopId, sessionId } = body
  const question = `Root cause: ${alert?.title ?? ''} — ${alert?.message ?? ''}`

  const { chunks } = await hybridRetrieve(supabase, {
    query: question,
    locale,
    shopId,
    days: 30,
    limit: 3,
  })

  const prompt = `Root cause analysis. ${localeInstruction(locale)}

Alert: ${alert?.title ?? ''} — ${alert?.message ?? ''}
${compactShopMetrics('Shop', analytics)}

JSON: {"summaryBn":"2 sentences","likelyCauses":["cause1","cause2"],"actions":["action1"]}`

  const enrichMs = Number(process.env.OLLAMA_NL_ENRICH_MS ?? 6_000)
  const gen = await Promise.race([
    generateText(prompt, { maxTokens: 280, json: true, timeoutMs: enrichMs }),
    new Promise((resolve) =>
      setTimeout(() => resolve({ text: '', provider: 'timeout' }), enrichMs),
    ),
  ])
  const parsed =
    parseInsightJson(gen.text) ??
    ruleBasedRootCause({
      productQuery: alert?.title ?? '',
      context: alert?.message ?? '',
      locale,
    })

  if (locale === 'bn' && isMostlyEnglish(parsed.summaryBn ?? '')) {
    parsed.summaryBn = await ensureAnswerBengali(parsed.summaryBn, 'bn')
  } else if (locale === 'en') {
    parsed.summaryBn = await translateText(parsed.summaryBn, 'en')
  }

  return { ...parsed, provider: gen.provider }
}
