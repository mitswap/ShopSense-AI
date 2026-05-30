import { useState } from 'react'
import { buildRootCauseContext } from '../lib/insightGenerator'
import { useI18n } from '../lib/i18n'
import type { AnalyticsSummary, Product, SaleRecord } from '../types'
import { apiFetch } from '../lib/apiClient'

interface RootCausePanelProps {
  products: Product[]
  sales: SaleRecord[]
  analytics: AnalyticsSummary
}

export function RootCausePanel({ products, sales, analytics }: RootCausePanelProps) {
  const { ui, locale } = useI18n()
  const [query, setQuery] = useState('Shirt')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    setLoading(true)
    const context = buildRootCauseContext(query, products, sales, analytics, locale)
    try {
      const res = await apiFetch('/api/root-cause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: query, context, locale }),
      })
      const data = await res.json()
      setResult(data.answerBn ?? context)
    } catch {
      setResult(context)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left">
      <h3 className="text-sm font-semibold text-slate-900">{ui.rootCauseTitle}</h3>
      <div className="mt-2 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
          placeholder={ui.rootCausePlaceholder}
        />
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading}
          className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {loading ? '…' : ui.analyze}
        </button>
      </div>
      {result && (
        <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{result}</p>
      )}
    </div>
  )
}
