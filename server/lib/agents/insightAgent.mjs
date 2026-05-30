/**
 * Insight agent — explanations and root-cause framing.
 */
export function runInsightAgent({ alerts, graph, decisionFeed }) {
  const lines = []

  if (decisionFeed?.length) {
    lines.push('Decision feed highlights:')
    for (const d of decisionFeed.slice(0, 5)) {
      lines.push(`- ${d.title ?? d.headline}: ${d.detail ?? d.reason ?? ''}`)
    }
  }

  if (graph?.nodes?.length) {
    const top = graph.nodes
      .filter((n) => n.type === 'product' || n.type === 'category')
      .slice(0, 6)
    for (const n of top) {
      lines.push(`Graph node ${n.label}: weight ${n.weight ?? 'n/a'}`)
    }
  }

  const critical = (alerts ?? []).filter((a) => a.severity === 'high' || a.severity === 'critical')
  for (const a of critical.slice(0, 5)) {
    lines.push(`Critical: ${a.title} — ${a.message}`)
  }

  return {
    agent: 'insight',
    summary: lines.join('\n') || 'No graph or critical alerts.',
    tools: ['explanation', 'root_cause_analysis'],
  }
}
