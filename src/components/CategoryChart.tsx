import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useI18n } from '../lib/i18n'
import { labelCategory } from '../lib/localeCopy'
import type { AnalyticsSummary } from '../types'

const COLORS = ['#059669', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b']

interface CategoryChartProps {
  analytics: AnalyticsSummary
}

export function CategoryChart({ analytics }: CategoryChartProps) {
  const { ui, currency, locale } = useI18n()
  const data = analytics.categoryBreakdown.map((c) => ({
    name: labelCategory(c.category, locale),
    value: Math.round(c.revenue || c.stockValue),
  }))

  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-left">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">{ui.categorySalesTitle}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => currency(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2">
        <p className="text-xs text-slate-500 mb-1">{ui.categoryLegendTitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          {data.map((entry, i) => (
            <div key={entry.name} className="text-xs text-slate-700 flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span>
                {entry.name}: {currency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
