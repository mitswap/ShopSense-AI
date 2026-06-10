import { useState } from 'react'
import { ChevronDown, Lightbulb, Sparkles } from 'lucide-react'
import { useI18n } from '../lib/useI18n'
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
  shopId: string
  shopName: string
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
  alerts: Alert[]
  products: Product[]
  sales: SaleRecord[]
  graph?: BusinessGraph
}

export function AiInsightPanel({
  shopId,
  shopName,
  analytics,
  forecasts,
  alerts,
  products,
  sales,
  graph,
}: AiInsightPanelProps) {
  void shopId
  const { ui, locale } = useI18n()
  const [insight, setInsight] = useState<AiInsightResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adviceSeed, setAdviceSeed] = useState(() => Date.now())
  const [openReasons, setOpenReasons] = useState<Record<number, boolean>>({})

  async function loadInsight() {
    const seed = Date.now()
    setAdviceSeed(seed)
    setLoading(true)
    setError(null)
    setOpenReasons({})
    setInsight(null)
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
    <div className="glass-card overflow-hidden text-left">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-sky-500 to-violet-500" />
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
          className="action-tile action-tile-primary justify-center disabled:opacity-50"
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
              className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                {i + 1}. {r.titleBn}
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">{r.actionBn}</p>
              {r.reasonBn && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setOpenReasons((prev) => ({ ...prev, [i]: !prev[i] }))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {openReasons[i] ? ui.hideReason : ui.showReason}
                    <ChevronDown className={`h-3.5 w-3.5 transition ${openReasons[i] ? 'rotate-180' : ''}`} />
                  </button>
                  {openReasons[i] && (
                    <p className="mt-2 rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-3 text-xs leading-relaxed text-slate-600">
                      {r.reasonBn}
                    </p>
                  )}
                </div>
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
