import type { DataInsight } from '../types'
import { useI18n } from '../lib/useI18n'

interface AutoInsightCardsProps {
  insights: DataInsight[]
}

export function AutoInsightCards({ insights }: AutoInsightCardsProps) {
  const { ui } = useI18n()
  if (insights.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
      <h2 className="text-sm font-semibold text-slate-900">{ui.shopInsights}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        {insights.slice(0, 6).map((ins) => (
          <div key={ins.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm">
            <p className="font-medium text-slate-900">{ins.titleBn}</p>
            <p className="text-slate-600 text-xs mt-1">{ins.explanationBn}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
