import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { answerNlQuery } from '../lib/nlQuery'
import { useI18n } from '../lib/i18n'
import type { AnalyticsSummary, ProductForecast, ShopData } from '../types'
import { apiFetch } from '../lib/apiClient'

interface NlQueryBarProps {
  shop: ShopData
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
}

export function NlQueryBar({ shop, analytics, forecasts }: NlQueryBarProps) {
  const { ui, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const local = answerNlQuery(query, shop, analytics, locale)
    try {
      const res = await apiFetch('/api/query/nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          locale,
          localAnswer: local.answerBn,
          dataContext: {
            analytics,
            products: shop.products,
            sales: shop.sales,
          },
          analytics,
          forecasts,
          products: shop.products,
          sales: shop.sales,
        }),
      })
      const data = await res.json()
      const remote = typeof data.answerBn === 'string' ? data.answerBn.trim() : ''
      const looksEmpty =
        !remote || /^no answer from data\.?$/i.test(remote)
      setAnswer(looksEmpty ? local.answerBn : remote)
    } catch {
      setAnswer(local.answerBn)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
        <MessageCircle className="w-4 h-4 text-brand-600" />
        {ui.shopAnalyzer}
      </h3>
      <p className="text-xs text-slate-500 mt-0.5">{ui.analyzerHint}</p>
      <form onSubmit={(e) => void submit(e)} className="mt-2 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ui.analyzerPlaceholder}
          className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {loading ? '…' : ui.ask}
        </button>
      </form>
      {answer && (
        <div className="mt-2 p-3 rounded-lg bg-brand-50 border border-brand-100 text-sm text-slate-800">
          {answer}
        </div>
      )}
    </div>
  )
}
