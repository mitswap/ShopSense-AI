import { orchestrateReasoning } from '../agents/orchestrator.mjs'
import {
  ensureAnswerBengali,
  isMostlyEnglish,
  translateText,
} from '../agents/translationAgent.mjs'
import {
  buildPromptContext,
  buildReasoningContext,
  collectEvidenceReferences,
} from '../rag/contextBuilder.mjs'
import { hybridRetrieve } from '../rag/retrieval.mjs'
import { appendSessionQuery } from '../rag/sessionStore.mjs'
import { buildReasoningEnvelope, runReasoningTask } from './runtime.mjs'
import { buildStructuredAdvice } from './structuredAdvice.mjs'
import { ruleBasedRootCause } from './ruleBasedRootCause.mjs'

function localeInstruction(locale) {
  if (locale === 'bn') {
    return 'All user-facing text must be in Bengali (Bangla script only). Keep numbers, SKU, and product codes accurate.'
  }
  return 'All user-facing text must be in clear English.'
}

function parseJsonBlock(text) {
  if (!text?.trim()) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function normalizeAdviceRecommendations(items = [], fallback = []) {
  return items
    .slice(0, 3)
    .map((item, index) => ({
      titleBn: item.titleBn ?? fallback[index]?.titleBn ?? '',
      actionBn: item.actionBn ?? fallback[index]?.actionBn ?? '',
      reasonBn: item.reasonBn ?? fallback[index]?.reasonBn,
      priority: Number(item.priority ?? index + 1),
      kind: item.kind ?? fallback[index]?.kind,
    }))
    .filter((item) => item.titleBn && item.actionBn)
}

function buildChatPrompt({ locale, question, promptContext, orchestration, dataContext }) {
  return `${localeInstruction(locale)}

You are ShopSense AI, a grounded retail intelligence assistant for Bangladesh SMEs.
Use only the provided analytics, agent evidence, and retrieved knowledge.
Do not invent numbers or business facts.
If evidence is weak, answer cautiously and keep it short.

Question:
${question}

Reasoning context:
${promptContext}

Agent evidence:
${JSON.stringify(
    orchestration.agentOutputs.map((agent) => ({
      agent: agent.agent,
      evidence: agent.evidence,
      confidence: agent.confidence,
      next: agent.recommendedNextToolCalls,
    })),
    null,
    2,
  )}

Structured data preview:
${JSON.stringify(dataContext ?? {}, null, 2).slice(0, 2500)}

Return valid JSON only:
{"answerBn":"under 90 words","intent":"${orchestration.intent}","dataUsed":["field1"],"confidence":0.84}`
}

function buildAdvicePrompt({ locale, promptContext, structuredAdvice, orchestration }) {
  return `${localeInstruction(locale)}

You are ShopSense AI producing grounded owner advice for a retail shop.
You must preserve the exact business meaning of the candidate actions.
Prioritize based on the evidence only. Do not invent metrics.

Reasoning context:
${promptContext}

Agent evidence:
${JSON.stringify(
    orchestration.agentOutputs.map((agent) => ({
      agent: agent.agent,
      evidence: agent.evidence,
      confidence: agent.confidence,
    })),
    null,
    2,
  )}

Candidate deterministic actions:
${JSON.stringify(structuredAdvice, null, 2)}

Return valid JSON only:
{"summaryBn":"short grounded summary","recommendations":[{"titleBn":"title","actionBn":"action","reasonBn":"reason","priority":1,"kind":"reorder"}],"adviceVariant":"${structuredAdvice.adviceVariant}","confidence":0.86}`
}

function buildRootCausePrompt({ locale, alert, promptContext, orchestration }) {
  return `${localeInstruction(locale)}

You are ShopSense AI performing grounded root-cause analysis.
Explain likely causes and actions using only provided evidence.
Avoid generic business fluff and do not invent data.

Alert:
${JSON.stringify(alert, null, 2)}

Reasoning context:
${promptContext}

Agent evidence:
${JSON.stringify(
    orchestration.agentOutputs.map((agent) => ({
      agent: agent.agent,
      evidence: agent.evidence,
      confidence: agent.confidence,
    })),
    null,
    2,
  )}

Return valid JSON only:
{"summaryBn":"2 grounded sentences","likelyCauses":["cause1","cause2"],"actions":["action1","action2"],"confidence":0.85}`
}

function withEnvelope(payload, runtime, ragMode) {
  return {
    ...payload,
    ...buildReasoningEnvelope({
      provider: runtime.provider,
      reasoningPath: runtime.reasoningPath,
      evidenceUsed: runtime.evidenceUsed,
      confidence: runtime.confidence,
      ragMode,
      validation: runtime.validation,
      attempts: runtime.attempts,
      fallbackDepth: runtime.fallbackDepth,
      latencyMs: runtime.latencyMs,
    }),
  }
}

async function localizeAdviceResult(locale, summaryBn, recommendations, fallbackRecommendations) {
  let finalSummary = summaryBn ?? ''
  let finalRecommendations = recommendations

  if (locale === 'bn') {
    if (isMostlyEnglish(finalSummary ?? '')) {
      finalSummary = await ensureAnswerBengali(finalSummary ?? '', 'bn')
    }
    finalRecommendations = await Promise.all(
      finalRecommendations.map(async (item, index) => ({
        ...item,
        titleBn: await ensureAnswerBengali(
          item.titleBn ?? fallbackRecommendations[index]?.titleBn ?? '',
          'bn',
        ),
        actionBn: await ensureAnswerBengali(
          item.actionBn ?? fallbackRecommendations[index]?.actionBn ?? '',
          'bn',
        ),
        reasonBn: item.reasonBn
          ? await ensureAnswerBengali(item.reasonBn, 'bn')
          : fallbackRecommendations[index]?.reasonBn,
      })),
    )
  } else {
    finalSummary = await translateText(finalSummary ?? '', 'en')
  }

  return {
    summaryBn: finalSummary,
    recommendations: finalRecommendations,
  }
}

export async function runInsightPipeline(supabase, body) {
  const {
    shopName,
    analytics,
    forecasts,
    alerts,
    locale = 'bn',
    decisionFeed,
    graph,
    shopId,
    sessionId,
    daysFilter = 30,
    products,
    sales,
    adviceSeed,
    dataContext,
  } = body

  const query =
    locale === 'bn'
      ? 'SME দোকান স্টক বিক্রয় পরামর্শ বাংলাদেশ'
      : 'SME shop stock sales advice grounded'

  const orchestration = await orchestrateReasoning({
    taskType: 'owner_advice',
    query,
    ctx: { analytics, forecasts, alerts, dataContext, graph, decisionFeed },
  })

  const { chunks, ragMode, sources } = await hybridRetrieve(supabase, {
    query,
    locale,
    shopId: shopId ?? shopName,
    days: daysFilter,
    limit: 5,
    taskType: 'owner_advice',
  })

  const structuredAdvice = buildStructuredAdvice({
    shopName,
    analytics,
    forecasts,
    products: products ?? dataContext?.products,
    sales: sales ?? dataContext?.sales,
    graph: graph ?? dataContext?.graph,
    locale,
    adviceSeed: adviceSeed ?? Date.now(),
  })

  const reasoningContext = buildReasoningContext({
    taskType: 'owner_advice',
    shopName,
    analytics,
    forecasts,
    alerts,
    locale,
    shopId: shopId ?? shopName,
    sessionId,
    ragChunks: chunks,
    daysFilter,
    graph,
    decisionFeed,
    dataContext,
  })

  const prompt = buildAdvicePrompt({
    locale,
    promptContext: buildPromptContext(reasoningContext),
    structuredAdvice,
    orchestration,
  })

  const evidenceUsed = collectEvidenceReferences(reasoningContext, orchestration)
  const runtime = await runReasoningTask({
    taskType: 'owner_advice',
    prompt,
    evidence: evidenceUsed,
    guards: {
      locale,
      requiredArrayFields: ['recommendations'],
      bengaliFields: ['summaryBn'],
    },
    fallback: () => ({
      provider: 'deterministic',
      parsed: {
        summaryBn: structuredAdvice.summaryBn,
        recommendations: structuredAdvice.recommendations,
        adviceVariant: structuredAdvice.adviceVariant,
      },
      confidence: 0.75,
      evidenceUsed,
    }),
    reasoningPath: ['task:owner_advice', `intent:${orchestration.intent}`],
  })

  const parsed = runtime.parsed ?? parseJsonBlock(runtime.text) ?? {}
  const recommendations = normalizeAdviceRecommendations(
    parsed.recommendations,
    structuredAdvice.recommendations,
  )
  const localized = await localizeAdviceResult(
    locale,
    parsed.summaryBn ?? structuredAdvice.summaryBn,
    recommendations.length ? recommendations : structuredAdvice.recommendations,
    structuredAdvice.recommendations,
  )

  const response = withEnvelope(
    {
      summaryBn: localized.summaryBn,
      recommendations: localized.recommendations,
      ragSources: sources?.length ? sources : [],
      intent: orchestration.intent,
      adviceVariant: parsed.adviceVariant ?? structuredAdvice.adviceVariant,
    },
    runtime,
    `${ragMode}+agentic`,
  )

  appendSessionQuery(shopId ?? shopName, sessionId, 'owner insight', localized.recommendations[0]?.actionBn ?? '')
  return response
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
    graph,
    decisionFeed,
    shopName = 'Shop',
    daysFilter = 30,
  } = body

  const orchestration = await orchestrateReasoning({
    taskType: 'chat_answer',
    query: question,
    ctx: {
      analytics: analytics ?? dataContext?.analytics,
      forecasts,
      alerts,
      dataContext,
      graph,
      decisionFeed,
    },
  })

  const { chunks, ragMode, sources } = await hybridRetrieve(supabase, {
    query: question,
    locale,
    shopId,
    days: daysFilter,
    limit: 4,
    taskType: 'chat_answer',
  })

  const reasoningContext = buildReasoningContext({
    taskType: 'chat_answer',
    shopName,
    analytics: analytics ?? dataContext?.analytics,
    forecasts,
    alerts,
    locale,
    shopId,
    sessionId,
    ragChunks: chunks,
    daysFilter,
    graph,
    decisionFeed,
    dataContext,
  })

  const evidenceUsed = collectEvidenceReferences(reasoningContext, orchestration)
  const prompt = buildChatPrompt({
    locale,
    question,
    promptContext: buildPromptContext(reasoningContext),
    orchestration,
    dataContext,
  })

  const runtime = await runReasoningTask({
    taskType: 'chat_answer',
    prompt,
    evidence: evidenceUsed,
    guards: {
      locale,
      requiredStringFields: ['answerBn', 'intent'],
      requiredArrayFields: ['dataUsed'],
      bengaliFields: ['answerBn'],
    },
    fallback: () => ({
      provider: 'deterministic',
      parsed: {
        answerBn:
          localAnswer ||
          (locale === 'bn' ? 'এই প্রশ্নের জন্য ডেটা দেখে নিশ্চিত উত্তর পাওয়া যায়নি।' : 'No grounded answer from data.'),
        intent: orchestration.intent,
        dataUsed: ['analytics'],
        confidence: 0.7,
      },
      confidence: 0.7,
      evidenceUsed,
    }),
    reasoningPath: ['task:chat_answer', `intent:${orchestration.intent}`],
  })

  const parsed = runtime.parsed ?? parseJsonBlock(runtime.text) ?? {}
  let answerBn =
    parsed.answerBn ||
    localAnswer ||
    (locale === 'bn' ? 'এই প্রশ্নের জন্য ডেটা দেখে নিশ্চিত উত্তর পাওয়া যায়নি।' : 'No grounded answer from data.')

  answerBn = await ensureAnswerBengali(answerBn, locale)
  if (locale === 'en') answerBn = await translateText(answerBn, 'en')

  appendSessionQuery(shopId, sessionId, question, answerBn)

  return withEnvelope(
    {
      answerBn,
      intent: parsed.intent ?? orchestration.intent,
      dataUsed: parsed.dataUsed ?? ['analytics'],
      ragSources: sources,
    },
    runtime,
    `${ragMode}+agentic`,
  )
}

export async function runRootCausePipeline(supabase, body) {
  const { alert, analytics, locale = 'bn', shopId, sessionId, graph, decisionFeed, dataContext } = body
  const question = `Root cause: ${alert?.title ?? ''} - ${alert?.message ?? ''}`

  const orchestration = await orchestrateReasoning({
    taskType: 'root_cause',
    query: question,
    ctx: { analytics, alerts: alert ? [alert] : [], graph, decisionFeed, dataContext },
  })

  const { chunks, ragMode, sources } = await hybridRetrieve(supabase, {
    query: question,
    locale,
    shopId,
    days: 30,
    limit: 4,
    taskType: 'root_cause',
  })

  const reasoningContext = buildReasoningContext({
    taskType: 'root_cause',
    shopName: 'Shop',
    analytics,
    forecasts: body.forecasts ?? [],
    alerts: alert ? [alert] : [],
    locale,
    shopId,
    sessionId,
    ragChunks: chunks,
    daysFilter: 30,
    graph,
    decisionFeed,
    dataContext,
  })

  const evidenceUsed = collectEvidenceReferences(reasoningContext, orchestration)
  const prompt = buildRootCausePrompt({
    locale,
    alert,
    promptContext: buildPromptContext(reasoningContext),
    orchestration,
  })

  const runtime = await runReasoningTask({
    taskType: 'root_cause',
    prompt,
    evidence: evidenceUsed,
    guards: {
      locale,
      requiredStringFields: ['summaryBn'],
      requiredArrayFields: ['likelyCauses', 'actions'],
      bengaliFields: ['summaryBn'],
    },
    fallback: () => {
      const parsed = ruleBasedRootCause({
        productQuery: alert?.title ?? '',
        context: alert?.message ?? '',
        locale,
      })
      return {
        provider: 'deterministic',
        parsed,
        confidence: 0.73,
        evidenceUsed,
      }
    },
    reasoningPath: ['task:root_cause', `intent:${orchestration.intent}`],
  })

  const parsed =
    runtime.parsed ??
    parseJsonBlock(runtime.text) ??
    ruleBasedRootCause({
      productQuery: alert?.title ?? '',
      context: alert?.message ?? '',
      locale,
    })

  if (locale === 'bn' && isMostlyEnglish(parsed.summaryBn ?? '')) {
    parsed.summaryBn = await ensureAnswerBengali(parsed.summaryBn, 'bn')
  } else if (locale === 'en') {
    parsed.summaryBn = await translateText(parsed.summaryBn, 'en')
    parsed.likelyCauses = await Promise.all(
      (parsed.likelyCauses ?? []).map(async (cause) => await translateText(cause, 'en')),
    )
    parsed.actions = await Promise.all(
      (parsed.actions ?? []).map(async (action) => await translateText(action, 'en')),
    )
  }

  return withEnvelope(
    {
      summaryBn: parsed.summaryBn,
      likelyCauses: parsed.likelyCauses ?? [],
      actions: parsed.actions ?? [],
      ragSources: sources ?? [],
    },
    runtime,
    `${ragMode}+agentic`,
  )
}
