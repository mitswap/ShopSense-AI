import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../lib/i18n'
import { labelProduct } from '../lib/localeCopy'
import type { ProductForecast } from '../types'

interface ForecastChartProps {
  forecasts: ProductForecast[]
}

export function ForecastChart({ forecasts }: ForecastChartProps) {
  const { ui, locale } = useI18n()
  const top = forecasts
    .filter((f) => f.risk === 'high' || f.risk === 'medium')
    .slice(0, 4)
  if (top.length === 0 && forecasts[0]) top.push(forecasts[0])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-left">
      <h3 className="text-sm font-semibold text-slate-900">{ui.forecastTitle}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-2">{ui.forecastHint}</p>
      {top.map((f) => (
        <div key={f.productId} className="mb-3">
          <p className="text-xs text-slate-600 mb-1">
            {labelProduct(f.name, locale)} · {ui.forecastCardMeta}: {f.currentStock} ·{' '}
            {ui.forecastCardMeta2}:{' '}
            {f.avgDailySales}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={f.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip />
              <Line type="monotone" dataKey="predicted" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
