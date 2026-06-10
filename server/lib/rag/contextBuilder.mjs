import { getSessionHistory } from './sessionStore.mjs'

function summarizeForecasts(forecasts = []) {
  return forecasts.slice(0, 8).map((f) => ({
    sku: f.sku,
    name: f.nameBn ?? f.name ?? f.productName ?? f.sku,
    risk: f.risk ?? f.stockoutRisk ?? 'unknown',
    avgDailySales: f.avgDailySales ?? null,
    currentStock: f.currentStock ?? null,
    daysUntilStockout: f.daysUntilStockout ?? null,
    suggestedReorder: f.suggestedReorder ?? null,
  }))
}

function summarizeAlerts(alerts = []) {
  return alerts.slice(0, 8).map((a) => ({
    id: a.id,
    type: a.type,
    severity: a.severity,
    sku: a.sku,
    message: a.messageBn ?? a.message ?? '',
  }))
}

function summarizeGraph(graph) {
  if (!graph) return null
  return {
    nodeCount: graph.nodes?.length ?? 0,
    edgeCount: graph.edges?.length ?? 0,
    nodes: (graph.nodes ?? []).slice(0, 10).map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
    })),
    bundleSuggestions: (graph.bundleSuggestions ?? []).slice(0, 4),
  }
}

function summarizeSessionHistory(shopId, sessionId) {
  return getSessionHistory(shopId, sessionId).slice(-5)
}

function summarizeChunks(ragChunks = [], locale = 'en') {
  return ragChunks.slice(0, 6).map((chunk, index) => ({
    rank: index + 1,
    id: chunk.id,
    title: chunk.title ?? chunk.category,
    category: chunk.category,
    content: locale === 'bn' ? chunk.content_bn ?? chunk.contentBn ?? chunk.content : chunk.content,
    source: chunk.source ?? 'rag',
    similarity: chunk.similarity ?? null,
  }))
}

export function buildReasoningContext({
  taskType,
  shopName,
  analytics,
  forecasts,
  alerts,
  locale,
  shopId,
  sessionId,
  ragChunks,
  daysFilter = 30,
  graph,
  decisionFeed = [],
  dataContext,
}) {
  return {
    taskType,
    locale,
    daysFilter,
    shop: {
      id: shopId ?? shopName ?? 'shop',
      name: shopName ?? 'Shop',
    },
    analytics: analytics
      ? {
          totalRevenue: analytics.totalRevenue ?? 0,
          totalRevenue30d: analytics.totalRevenue30d ?? analytics.totalRevenue ?? 0,
          totalStockValue: analytics.totalStockValue ?? 0,
          totalSkus: analytics.totalSkus ?? 0,
          lowStockCount: analytics.lowStockCount ?? 0,
          overstockCount: analytics.overstockCount ?? 0,
          deadStockCount: analytics.deadStockCount ?? 0,
          monthlyGrowthPct: analytics.monthlyGrowthPct ?? null,
          profitEstimate: analytics.profitEstimate ?? 0,
          bestSeller: analytics.bestSeller ?? null,
          topMovers: analytics.topMovers ?? [],
          slowMovers: analytics.slowMovers ?? [],
          categoryBreakdown: analytics.categoryBreakdown ?? [],
          festivalLift: analytics.festivalLift ?? [],
          festivalSummary: analytics.festivalSummary ?? [],
          festivalProductLeaders: analytics.festivalProductLeaders ?? [],
          weekdayPattern: analytics.weekdayPattern ?? [],
          locationPerformance: analytics.locationPerformance ?? [],
        }
      : null,
    forecasts: summarizeForecasts(forecasts),
    alerts: summarizeAlerts(alerts),
    graph: summarizeGraph(graph ?? dataContext?.graph),
    decisionFeed: (decisionFeed ?? []).slice(0, 5),
    recentSession: summarizeSessionHistory(shopId, sessionId),
    rag: {
      chunks: summarizeChunks(ragChunks, locale),
      sources: summarizeChunks(ragChunks, locale).map((chunk) => chunk.title),
    },
    rawDataPreview: dataContext
      ? {
          products: (dataContext.products ?? []).slice(0, 6),
          salesCount: (dataContext.sales ?? []).length,
        }
      : null,
  }
}

export function buildPromptContext(reasoningContext) {
  const localeNote =
    reasoningContext.locale === 'bn'
      ? 'All owner-facing output MUST be in Bengali (Bangla script only).'
      : 'All owner-facing output MUST be in English.'

  return `Task: ${reasoningContext.taskType}
Shop: ${reasoningContext.shop.name}
Window: ${reasoningContext.daysFilter} days

Analytics:
${JSON.stringify(reasoningContext.analytics ?? {}, null, 2)}

Forecasts:
${JSON.stringify(reasoningContext.forecasts ?? [], null, 2)}

Alerts:
${JSON.stringify(reasoningContext.alerts ?? [], null, 2)}

Graph:
${JSON.stringify(reasoningContext.graph ?? {}, null, 2)}

Decision feed:
${JSON.stringify(reasoningContext.decisionFeed ?? [], null, 2)}

Recent session:
${JSON.stringify(reasoningContext.recentSession ?? [], null, 2)}

Knowledge:
${JSON.stringify(reasoningContext.rag?.chunks ?? [], null, 2)}

Language:
${localeNote}`
}

export function collectEvidenceReferences(reasoningContext, orchestration = null) {
  const refs = []

  if (reasoningContext.analytics) {
    refs.push(
      'analytics.totalRevenue30d',
      'analytics.lowStockCount',
      'analytics.deadStockCount',
      'analytics.festivalLift',
      'analytics.festivalSummary',
    )
  }
  if ((reasoningContext.forecasts ?? []).length) refs.push('forecasts')
  if ((reasoningContext.alerts ?? []).length) refs.push('alerts')
  if ((reasoningContext.graph?.bundleSuggestions ?? []).length) refs.push('graph.bundleSuggestions')
  if ((reasoningContext.rag?.chunks ?? []).length) refs.push('rag.chunks')
  if (orchestration?.evidenceUsed?.length) refs.push(...orchestration.evidenceUsed)

  return [...new Set(refs)]
}
