/**
 * Sales agent — trends and revenue insights.
 */
export function runSalesAgent({ analytics, forecasts, dataContext }) {
  const lines = []
  lines.push(`Total revenue: ${analytics?.totalRevenue ?? 'n/a'}`)
  lines.push(`Total orders: ${analytics?.totalOrders ?? 'n/a'}`)
  lines.push(`Top category: ${analytics?.topCategory ?? 'n/a'}`)

  if (analytics?.revenueByDay?.length) {
    const recent = analytics.revenueByDay.slice(-7)
    const sum = recent.reduce((s, d) => s + (d.revenue ?? d.value ?? 0), 0)
    lines.push(`Last 7 days revenue sum: ${sum}`)
  }

  if (forecasts?.length) {
    const rising = forecasts.filter((f) => f.trend === 'up').slice(0, 4)
    for (const f of rising) {
      lines.push(`Rising demand: ${f.productName ?? f.sku}`)
    }
  }

  if (dataContext?.sales?.length) {
    const last30 = dataContext.sales.slice(-30)
    lines.push(`Recent sale rows: ${last30.length}`)
  }

  return {
    agent: 'sales',
    summary: lines.join('\n'),
    tools: ['trend_analysis', 'revenue_insights'],
  }
}
