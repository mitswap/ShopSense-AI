import { buildStructuredAdvice } from './structuredAdvice.mjs'

/**
 * Data-driven owner advice (exact numbers, 3 items, rotates on adviceSeed).
 */
export function ruleBasedInsight({
  shopName,
  analytics,
  forecasts,
  products,
  sales,
  graph,
  locale = 'bn',
  adviceSeed,
}) {
  return buildStructuredAdvice({
    shopName,
    analytics,
    forecasts,
    products,
    sales,
    graph,
    locale,
    adviceSeed,
  })
}
