import { getSessionHistory } from './sessionStore.mjs'

/**
 * Merge shop profile, analytics window, session history, and RAG chunks.
 */
export function buildContext({
  shopName,
  analytics,
  forecasts,
  alerts,
  locale,
  shopId,
  sessionId,
  ragChunks,
  daysFilter = 30,
}) {
  const history = getSessionHistory(shopId, sessionId)
  const historyBlock =
    history.length > 0
      ? history
          .slice(-5)
          .map((h, i) => `Q${i + 1}: ${h.q}\nA${i + 1}: ${h.a}`)
          .join('\n')
      : 'No prior questions in this session.'

  const shopProfile = analytics
    ? `Shop: ${shopName}
Revenue (last ${daysFilter}d context): ${analytics.totalRevenue30d ?? analytics.totalRevenue ?? 'n/a'}
Orders: ${analytics.totalOrders ?? analytics.totalSkus ?? 'n/a'}
Top category: ${analytics.topCategory ?? analytics.bestSeller ?? 'n/a'}
Low stock SKUs: ${analytics.lowStockCount ?? 0}
Dead stock value: ${analytics.deadStockValue ?? 0}`
    : `Shop: ${shopName}`

  const forecastBlock =
    forecasts?.length > 0
      ? forecasts
          .slice(0, 6)
          .map(
            (f) =>
              `- ${f.productName ?? f.sku}: risk ${f.stockoutRisk ?? 'n/a'}, trend ${f.trend ?? 'n/a'}`,
          )
          .join('\n')
      : 'No forecast rows.'

  const alertBlock =
    alerts?.length > 0
      ? alerts
          .slice(0, 8)
          .map((a) => `- [${a.severity}] ${a.title}: ${a.message}`)
          .join('\n')
      : 'No active alerts.'

  const ragBlock =
    ragChunks?.length > 0
      ? ragChunks
          .map((c, i) => `[${i + 1}] ${c.title} (${c.category}): ${c.content.slice(0, 600)}`)
          .join('\n\n')
      : 'No knowledge chunks retrieved.'

  const localeNote =
    locale === 'bn'
      ? 'All owner-facing output MUST be in Bengali (Bangla script — বাংলা only). No English.'
      : 'All owner-facing output MUST be in English.'

  return `## Shop profile
${shopProfile}

## Time window
Analytics and recommendations should emphasize the last ${daysFilter} days where applicable.

## Recent session
${historyBlock}

## Forecasts (14-day)
${forecastBlock}

## Alerts
${alertBlock}

## Knowledge (RAG)
${ragBlock}

## Language
${localeNote}`
}
