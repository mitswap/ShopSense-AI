import { useMemo, useState } from 'react'
import { CloudSun, LocateFixed, RefreshCw, Store } from 'lucide-react'
import { apiFetch } from '../lib/apiClient'
import { useI18n } from '../lib/useI18n'
import { loadPreferredWeatherCity, savePreferredWeatherCity } from '../lib/weatherPreferences'
import type { AnalyticsSummary, Product, ProductForecast, WeatherCardResponse } from '../types'

interface WeatherAdviceCardProps {
  shopId: string
  analytics: AnalyticsSummary
  products: Product[]
  forecasts: ProductForecast[]
}

export function WeatherAdviceCard({
  shopId,
  analytics,
  products,
  forecasts,
}: WeatherAdviceCardProps) {
  const { ui, locale } = useI18n()
  const [city, setCity] = useState(() => loadPreferredWeatherCity(shopId))
  const [weather, setWeather] = useState<WeatherCardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasWeather = weather !== null

  const payload = useMemo(
    () => ({
      city: city.trim(),
      locale,
      analytics,
      products,
      forecasts,
    }),
    [analytics, city, forecasts, locale, products],
  )

  async function loadWeather() {
    if (!city.trim()) {
      setError(ui.weatherCityRequired)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/weather/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const raw = await res.text()
      let json: WeatherCardResponse | { error?: string } | null = null

      if (raw.trim()) {
        try {
          json = JSON.parse(raw) as WeatherCardResponse | { error?: string }
        } catch {
          throw new Error(ui.weatherLoadFailed)
        }
      }

      if (!res.ok || !json || !('location' in json)) {
        const message =
          json && 'error' in json && typeof json.error === 'string'
            ? json.error
            : ui.weatherLoadFailed
        throw new Error(message)
      }

      savePreferredWeatherCity(city.trim(), shopId)
      setWeather(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.weatherLoadFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card overflow-hidden text-left">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CloudSun className="h-4 w-4 text-sky-600" />
            {ui.weatherAdviceTitle}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{ui.weatherAdviceHint}</p>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${hasWeather ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">{ui.weatherShopCityLabel}</span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={ui.weatherShopCityPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadWeather()}
                disabled={loading}
                className="action-tile action-tile-primary min-w-[164px] justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {ui.loading}
                  </>
                ) : (
                  <>
                    <LocateFixed className="h-4 w-4" />
                    {ui.weatherLoadButton}
                  </>
                )}
              </button>
            </div>
          </label>
          {error && <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>}
          {!weather && !error && <p className="mt-3 text-xs text-slate-500">{ui.weatherEmptyHint}</p>}
          {weather && (
            <div className="mt-4 rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {weather.location.name}, {weather.location.country}
                  </p>
                  <h4 className="mt-1 text-2xl font-bold text-slate-900">
                    {weather.current.tempC.toFixed(0)} C
                  </h4>
                  <p className="mt-1 text-sm font-medium text-slate-700">{weather.current.conditionText}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ui.weatherFeelsLike}: {weather.current.feelsLikeC.toFixed(0)} C | {ui.weatherHumidity}:{' '}
                    {weather.current.humidity}% | {ui.weatherWind}: {weather.current.windKph.toFixed(0)} km/h
                  </p>
                </div>
                {weather.current.conditionIcon ? (
                  <img
                    src={weather.current.conditionIcon}
                    alt={weather.current.conditionText}
                    className="h-14 w-14 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-sm"
                  />
                ) : null}
              </div>
              <p className="mt-4 rounded-2xl border border-cyan-100 bg-white/80 px-3 py-3 text-sm font-semibold leading-relaxed text-slate-800">
                {weather.advice.summary}
              </p>
            </div>
          )}
        </div>

        {hasWeather ? (
          <div className="space-y-3">
            <AdviceBucket title={ui.weatherDailyLifeTitle} items={weather.advice.dailyLife ?? []} accent="sky" emptyLabel={ui.weatherNoAdviceYet} />
            <AdviceBucket title={ui.weatherFrontDeskTitle} items={weather.advice.frontDeskWinners ?? []} accent="emerald" emptyLabel={ui.weatherNoAdviceYet} />
            <AdviceBucket title={ui.weatherLikelyLosersTitle} items={weather.advice.likelyLosers ?? []} accent="amber" emptyLabel={ui.weatherNoAdviceYet} />
            <AdviceBucket title={ui.weatherShopActionsTitle} items={weather.advice.shopActions ?? []} accent="violet" emptyLabel={ui.weatherNoAdviceYet} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AdviceBucket({
  title,
  items,
  accent,
  emptyLabel,
}: {
  title: string
  items: string[]
  accent: 'sky' | 'emerald' | 'amber' | 'violet'
  emptyLabel: string
}) {
  const accentMap = {
    sky: 'border-sky-100 bg-sky-50/70 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    violet: 'border-violet-100 bg-violet-50/70 text-violet-700',
  } as const

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
      <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${accentMap[accent]}`}>
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={`${title}-${item}`} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700">
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            {emptyLabel}
          </p>
        )}
      </div>
    </div>
  )
}
