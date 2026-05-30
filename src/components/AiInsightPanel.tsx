import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { fetchAiInsight, fallbackInsight } from '../lib/ai'
import type {
  AiInsightResponse,
  Alert,
  AnalyticsSummary,
  BusinessGraph,
  Product,
  ProductForecast,
  SaleRecord,
} from '../types'

interface AiInsightPanelProps {
  shopName: string
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
  alerts: Alert[]
  products: Product[]
  sales: SaleRecord[]
  graph?: BusinessGraph
}

export function AiInsightPanel({
  shopName,
  analytics,
  forecasts,
  alerts,
  products,
  sales,
  graph,
}: AiInsightPanelProps) {
  const { ui, locale } = useI18n()
  const [insight, setInsight] = useState<AiInsightResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adviceSeed, setAdviceSeed] = useState(() => Date.now())

  useEffect(() => {
    setInsight(null)
    setError(null)
  }, [locale])

  async function loadInsight() {
    const seed = Date.now()
    setAdviceSeed(seed)
    setLoading(true)
    setError(null)
    const payload = {
      shopName,
      analytics,
      forecasts,
      alerts,
      products,
      sales,
      locale,
      graph,
      adviceSeed: seed,
    }
    try {
      const res = await fetchAiInsight(payload)
      setInsight(res)
    } catch {
      setInsight(fallbackInsight(payload))
      setError(ui.adviceOffline)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm text-left">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-600" />
            {ui.ownerAdvice}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{ui.ownerAdviceHint}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadInsight()}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {loading ? ui.loading : ui.getAiAdvice}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-amber-700">{error}</p>}
      {insight && insight.recommendations.length > 0 && (
        <ol className="mt-3 space-y-2 text-sm list-none">
          {insight.recommendations.slice(0, 3).map((r, i) => (
            <li
              key={`${adviceSeed}-${i}-${r.titleBn}`}
              className="p-3 rounded-lg bg-white border border-slate-100"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                {i + 1}. {r.titleBn}
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">{r.actionBn}</p>
              {r.reasonBn && (
                <p className="text-xs text-slate-500 mt-1.5 border-t border-slate-50 pt-1.5">
                  {r.reasonBn}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      {insight && insight.ragSources?.length > 0 && (
        <p className="text-[10px] text-slate-400 pt-2">
          {ui.sources}: {insight.ragSources.slice(0, 2).join(' · ')}
        </p>
      )}
    </div>
  )
}
