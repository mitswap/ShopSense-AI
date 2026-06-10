import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { useI18n } from '../lib/useI18n'
import { salesByDay } from '../lib/analyticsEngine'
import type { SaleRecord } from '../types'

interface SalesChartProps {
  sales: SaleRecord[]
}

export function SalesChart({ sales }: SalesChartProps) {
  const { ui } = useI18n()
  const data = salesByDay(sales)
  const latest = data[data.length - 1]
  const peak = [...data].sort((a, b) => b.revenue - a.revenue)[0]
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 text-sm">
        {ui.noData}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-left">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">{ui.salesVolume}</h3>
        <p className="mb-2 text-xs leading-relaxed text-slate-600">
          {latest && peak
            ? `Latest sales activity sits at ${latest.qty} units on ${latest.date}, while the strongest revenue day reached ${Math.round(peak.revenue)}. Use this to compare daily velocity against your top-performing day.`
            : 'Track daily unit movement to see whether your current sales rhythm is accelerating or cooling down.'}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="qty" fill="#059669" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-left">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">{ui.salesRevenue}</h3>
        <p className="mb-2 text-xs leading-relaxed text-slate-600">
          {peak
            ? `Revenue swings are easier to read here: your peak day currently generated about ${Math.round(peak.revenue)} in sales. Watch whether new promos or live stock edits push this curve upward over the next few days.`
            : 'This revenue line shows whether recent pricing and stock decisions are translating into stronger cash intake.'}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
