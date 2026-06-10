/**
 * Sales agent — grounded revenue and demand evidence.
 */
export function runSalesAgent({ analytics, forecasts, dataContext }) {
  const recentRevenue = analytics?.revenueByDay?.slice?.(-7) ?? []
  const last7dRevenue = recentRevenue.reduce((sum, day) => sum + (day.revenue ?? day.value ?? 0), 0)

  const risingForecasts = (forecasts ?? [])
    .filter((f) => f.risk === 'high' || f.trend === 'up' || (f.avgDailySales ?? 0) > 1)
    .slice(0, 5)
    .map((f) => ({
      sku: f.sku,
      name: f.nameBn ?? f.name ?? f.productName ?? f.sku,
      avgDailySales: f.avgDailySales ?? null,
      suggestedReorder: f.suggestedReorder ?? null,
      risk: f.risk ?? 'unknown',
    }))

  const recentSalesRows = (dataContext?.sales ?? []).slice(-30).length

  const summaryLines = [
    `Total revenue: ${analytics?.totalRevenue ?? 'n/a'}`,
    `30 day revenue: ${analytics?.totalRevenue30d ?? analytics?.totalRevenue ?? 'n/a'}`,
    `Best seller: ${analytics?.bestSeller?.name ?? 'n/a'}`,
    `Last 7 days revenue sum: ${last7dRevenue}`,
    ...risingForecasts.map((f) => `Demand signal ${f.sku}: risk ${f.risk}`),
    `Recent sales rows inspected: ${recentSalesRows}`,
  ]

  return {
    agent: 'sales',
    intentSupport: ['sales', 'revenue', 'trend', 'forecast', 'festival'],
    inputsNeeded: ['analytics.totalRevenue', 'analytics.bestSeller', 'forecasts', 'sales'],
    evidence: {
      totalRevenue: analytics?.totalRevenue ?? 0,
      totalRevenue30d: analytics?.totalRevenue30d ?? analytics?.totalRevenue ?? 0,
      bestSeller: analytics?.bestSeller ?? null,
      monthlyGrowthPct: analytics?.monthlyGrowthPct ?? null,
      topMovers: analytics?.topMovers ?? [],
      last7dRevenue,
      risingForecasts,
      recentSalesRows,
    },
    summary: summaryLines.join('\n'),
    confidence: analytics?.totalRevenue ? 0.9 : 0.7,
    completeness: {
      hasAnalytics: Boolean(analytics),
      hasForecasts: Boolean((forecasts ?? []).length),
      hasSales: Boolean((dataContext?.sales ?? []).length),
    },
    recommendedNextToolCalls: ['forecast_explainer', 'dashboard_summary'],
    tools: ['trend_analysis', 'revenue_insights'],
  }
}
