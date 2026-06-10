import { Package, AlertTriangle, TrendingUp, Wallet, Skull, Percent } from 'lucide-react'
import { useI18n } from '../lib/useI18n'
import { labelProduct } from '../lib/localeCopy'
import type { AnalyticsSummary } from '../types'

interface KpiCardsProps {
  analytics: AnalyticsSummary
}

export function KpiCards({ analytics }: KpiCardsProps) {
  const { ui, currency, locale } = useI18n()
  const cards = [
    {
      label: ui.kpiTotalSales,
      value: currency(analytics.totalRevenue),
      icon: Wallet,
      color: 'text-brand-700 bg-brand-50',
    },
    {
      label: ui.kpiProfit,
      value: currency(analytics.profitEstimate),
      icon: Percent,
      color: 'text-violet-700 bg-violet-50',
    },
    {
      label: analytics.monthlyGrowthPct !== null ? ui.kpiGrowth : ui.kpi30DaySales,
      value:
        analytics.monthlyGrowthPct !== null
          ? `${analytics.monthlyGrowthPct >= 0 ? '+' : ''}${analytics.monthlyGrowthPct.toFixed(1)}%`
          : currency(analytics.totalRevenue30d),
      icon: TrendingUp,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: ui.kpiBestSeller,
      value: analytics.bestSeller ? labelProduct(analytics.bestSeller.name, locale) : '—',
      icon: Package,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: ui.kpiLowStock,
      value: String(analytics.lowStockCount),
      icon: AlertTriangle,
      color: 'text-red-700 bg-red-50',
    },
    {
      label: ui.kpiDeadStock,
      value: String(analytics.deadStockCount),
      icon: Skull,
      color: 'text-slate-700 bg-slate-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm text-left"
        >
          <div className={`w-8 h-8 rounded flex items-center justify-center ${c.color}`}>
            <c.icon className="w-4 h-4" />
          </div>
          <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-wide">{c.label}</p>
          <p className="text-sm font-bold text-slate-900 truncate">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
