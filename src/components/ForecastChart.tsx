import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../lib/useI18n'
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
            {labelProduct(f.name, locale)} · {ui.forecastCardMeta}: {f.currentStock} · {ui.forecastCardMeta2}: {f.avgDailySales}
          </p>
          <p className="mb-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-slate-700">
            {locale === 'bn'
              ? `${labelProduct(f.name, locale)}-এর বর্তমান স্টক ${f.currentStock}, আর দৈনিক বিক্রির গতি ${f.avgDailySales}। তাই এই কার্ভটি দেখায় কোন পণ্যে আগে রি-অর্ডার বা ডিসপ্লে জোরদার করতে হবে।`
              : `${labelProduct(f.name, locale)} has ${f.currentStock} units on hand and is moving at about ${f.avgDailySales} per day. This curve explains which items need earlier reorder or stronger shelf attention.`}
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
