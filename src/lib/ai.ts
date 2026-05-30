import type { AiInsightRequest, AiInsightResponse } from '../types'
import { graphContextForPrompt } from './graphBuilder'
import { getIntelligenceSessionId, getIntelligenceShopId } from './intelligenceSession'
import { retrieveForAlerts } from './knowledge'
import { retrieveRag } from './rag'
import { buildStructuredAdvice } from './structuredAdvice'
import { apiFetch } from './apiClient'

export async function fetchAiInsight(
  payload: Omit<AiInsightRequest, 'ragChunks'>,
): Promise<AiInsightResponse & { ragMode?: string; adviceVariant?: string }> {
  const ragQuery =
    payload.alerts.map((a) => a.messageBn).join(' ') +
    (payload.locale === 'en'
      ? ' bangladesh apparel stock reorder festival discount'
      : ' ঈদ স্টক ছাড় রিঅর্ডার বাংলাদেশ')

  const ragResult = await retrieveRag(
    ragQuery,
    payload.alerts.map((a) => a.type),
    payload.locale,
  )
  const ragChunks =
    ragResult.chunks.length > 0
      ? ragResult.chunks
      : retrieveForAlerts(payload.alerts.map((a) => a.type))

  const res = await apiFetch('/api/insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      ragChunks,
      ragQuery,
      shopId: getIntelligenceShopId(),
      sessionId: getIntelligenceSessionId(),
      daysFilter: 30,
      graphContext: payload.graph ? graphContextForPrompt(payload.graph) : undefined,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `AI request failed: ${res.status}`)
  }

  const json = (await res.json()) as AiInsightResponse & { ragMode?: string; adviceVariant?: string }
  if ((json.recommendations?.length ?? 0) >= 3) {
    return { ...json, ragMode: json.ragMode ?? ragResult.mode }
  }

  const local = buildStructuredAdvice({
    shopName: payload.shopName,
    analytics: payload.analytics,
    forecasts: payload.forecasts,
    products: payload.products,
    sales: payload.sales,
    graph: payload.graph,
    locale: payload.locale,
    adviceSeed: payload.adviceSeed,
  })

  return {
    summaryBn: local.summaryBn,
    recommendations: local.recommendations,
    ragSources: ragChunks.map((c) =>
      payload.locale === 'en' ? c.content : c.contentBn,
    ),
    ragMode: ragResult.mode,
    adviceVariant: local.adviceVariant,
  }
}

export function fallbackInsight(
  payload: Omit<AiInsightRequest, 'ragChunks'>,
): AiInsightResponse {
  const local = buildStructuredAdvice({
    shopName: payload.shopName,
    analytics: payload.analytics,
    forecasts: payload.forecasts,
    products: payload.products,
    sales: payload.sales,
    graph: payload.graph,
    locale: payload.locale,
    adviceSeed: payload.adviceSeed ?? Date.now(),
  })

  const ragChunks = retrieveForAlerts(payload.alerts.map((a) => a.type))

  return {
    summaryBn: local.summaryBn,
    recommendations: local.recommendations,
    ragSources: ragChunks.map((c) =>
      payload.locale === 'en' ? c.content : c.contentBn,
    ),
  }
}
