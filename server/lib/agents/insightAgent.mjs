/**
 * Insight agent — grounded graph, alert, and action evidence.
 */
export function runInsightAgent({ alerts, graph, decisionFeed }) {
  const criticalAlerts = (alerts ?? [])
    .filter((a) => a.severity === 'high' || a.severity === 'critical')
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.messageBn,
      sku: a.sku,
    }))

  const graphNodes = (graph?.nodes ?? [])
    .filter((node) => node.type === 'product' || node.type === 'category' || node.type === 'festival')
    .slice(0, 8)
    .map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      weight: node.weight ?? null,
    }))

  const bundleSuggestions = (graph?.bundleSuggestions ?? []).slice(0, 3)
  const feedHighlights = (decisionFeed ?? []).slice(0, 5).map((item) => ({
    id: item.id,
    title: item.titleBn ?? item.title ?? item.headline ?? '',
    detail: item.bodyBn ?? item.detail ?? item.reason ?? '',
    severity: item.severity ?? 'medium',
  }))

  const summaryLines = [
    ...(feedHighlights.length ? ['Decision feed highlights:'] : []),
    ...feedHighlights.map((d) => `- ${d.title}: ${d.detail}`),
    ...graphNodes.map((n) => `Graph node ${n.label}: ${n.type}`),
    ...bundleSuggestions.map((b) => `Bundle signal: ${b.products.join(' + ')}`),
    ...criticalAlerts.map((a) => `Critical alert ${a.type}: ${a.message}`),
  ]

  return {
    agent: 'insight',
    intentSupport: ['explain', 'why', 'root', 'graph', 'bundle', 'advice'],
    inputsNeeded: ['alerts', 'graph', 'decisionFeed'],
    evidence: {
      criticalAlerts,
      graphNodes,
      bundleSuggestions,
      feedHighlights,
    },
    summary: summaryLines.join('\n') || 'No graph or critical alerts.',
    confidence: criticalAlerts.length || graphNodes.length || bundleSuggestions.length ? 0.88 : 0.68,
    completeness: {
      hasAlerts: Boolean((alerts ?? []).length),
      hasGraph: Boolean((graph?.nodes ?? []).length),
      hasDecisionFeed: Boolean((decisionFeed ?? []).length),
    },
    recommendedNextToolCalls: ['graph_explainer', 'root_cause', 'owner_advice'],
    tools: ['explanation', 'root_cause_analysis'],
  }
}
