import { useState } from 'react'
import { buildRootCauseContext } from '../lib/insightGenerator'
import { getIntelligenceSessionId, getIntelligenceShopId } from '../lib/intelligenceSession'
import { useI18n } from '../lib/useI18n'
import type {
  AnalyticsSummary,
  BusinessGraph,
  DecisionFeedItem,
  Product,
  ProductForecast,
  SaleRecord,
} from '../types'
import { apiFetch } from '../lib/apiClient'

interface RootCausePanelProps {
  shopId?: string
  products: Product[]
  sales: SaleRecord[]
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
  graph?: BusinessGraph
  decisionFeed?: DecisionFeedItem[]
}

interface RootCauseApiResponse {
  answerBn: string
  causes: string[]
  actions: string[]
}

interface RootCauseResult {
  summary: string
  causes: string[]
  actions: string[]
}

export function RootCausePanel({
  shopId,
  products,
  sales,
  analytics,
  forecasts,
  graph,
  decisionFeed = [],
}: RootCausePanelProps) {
  const { ui, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<RootCauseResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    setLoading(true)
    const context = buildRootCauseContext(query, products, sales, analytics, locale)
    const sessionId = getIntelligenceSessionId()
    const resolvedShopId = shopId ?? getIntelligenceShopId()
    try {
      const res = await apiFetch('/api/root-cause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productQuery: query,
          context,
          locale,
          analytics,
          forecasts,
          graph,
          decisionFeed,
          dataContext: {
            snippet: context,
            context,
            products,
            sales,
            analytics,
            graph,
          },
          shopId: resolvedShopId,
          sessionId,
        }),
      })
      const data = (await res.json()) as Partial<RootCauseApiResponse>
      setResult({
        summary: extractRootCauseSummary(
          typeof data.answerBn === 'string' && data.answerBn.trim() ? data.answerBn.trim() : context,
          locale,
        ),
        causes: Array.isArray(data.causes) ? data.causes.filter(isNonEmptyString) : [],
        actions: Array.isArray(data.actions) ? data.actions.filter(isNonEmptyString) : [],
      })
    } catch {
      setResult({
        summary: extractRootCauseSummary(context, locale),
        causes: [],
        actions: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const labels = getSectionLabels(locale)

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      <h3 className="text-sm font-semibold text-slate-900">{ui.rootCauseTitle}</h3>
      <div className="mt-2 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
          placeholder={ui.rootCausePlaceholder}
        />
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          {loading ? '...' : ui.analyze}
        </button>
      </div>
      {result && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <BulletSection title={labels.summary} items={[result.summary]} />
          {result.causes.length > 0 ? <BulletSection title={labels.causes} items={result.causes} /> : null}
          {result.actions.length > 0 ? <BulletSection title={labels.actions} items={result.actions} /> : null}
        </div>
      )}
    </div>
  )
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getSectionLabels(locale: string) {
  if (locale === 'bn') {
    return {
      summary: 'সারাংশ',
      causes: 'মূল কারণগুলো',
      actions: 'করণীয়',
    }
  }

  return {
    summary: 'Summary',
    causes: 'Likely Causes',
    actions: 'Recommended Actions',
  }
}

function extractRootCauseSummary(text: string, locale: string) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const markers =
    locale === 'bn'
      ? ['মূল কারণগুলো:', 'করণীয়:', 'Likely causes:', 'Recommended actions:']
      : ['Likely causes:', 'Recommended actions:', 'মূল কারণগুলো:', 'করণীয়:']

  let end = normalized.length
  for (const marker of markers) {
    const idx = normalized.indexOf(marker)
    if (idx !== -1) end = Math.min(end, idx)
  }

  return normalized.slice(0, end).trim().replace(/[.:;\s]+$/, '')
}
