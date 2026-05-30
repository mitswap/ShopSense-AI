import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Header } from './components/Header'
import { SetupBanner } from './components/SetupBanner'
import { TechStackPanel } from './components/TechStackPanel'
import { CsvUpload } from './components/CsvUpload'
import { AddProductForm } from './components/AddProductForm'
import { KpiCards } from './components/KpiCards'
import { StockTable } from './components/StockTable'
import { SalesChart } from './components/SalesChart'
import { ForecastChart } from './components/ForecastChart'
import { CategoryChart } from './components/CategoryChart'
import { AlertsPanel } from './components/AlertsPanel'
import { AiInsightPanel } from './components/AiInsightPanel'
import { AutoInsightCards } from './components/AutoInsightCards'
import { NlQueryBar } from './components/NlQueryBar'
import { GraphPanel } from './components/GraphPanel'
import { RootCausePanel } from './components/RootCausePanel'
import { useShopData } from './hooks/useShopData'
import { I18nProvider, useI18n } from './lib/i18n'
import { getSessionUser, login, logout, type AppUser } from './lib/auth'
import { clearLocalShop } from './lib/storage'

const queryClient = new QueryClient()

function LoginPanel({ onLoggedIn }: { onLoggedIn: (user: AppUser) => void }) {
  const { ui } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const user = login(username.trim(), password)
    if (!user) {
      setError(ui.invalidCredentials)
      return
    }
    setError('')
    onLoggedIn(user)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">{ui.loginTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{ui.loginHint}</p>
        <label className="block mt-4">
          <span className="text-xs text-slate-600">{ui.username}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="block mt-3">
          <span className="text-xs text-slate-600">{ui.password}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <button type="submit" className="mt-4 w-full bg-brand-600 text-white rounded-lg py-2 text-sm">
          {ui.signIn}
        </button>
        <p className="text-[11px] text-slate-500 mt-3">
          Demo: owner1/shopsense123 · Docs admin: admin/docsadmin2026
        </p>
        <Link to="/docs" className="block text-center text-xs text-brand-600 mt-2 hover:underline">
          View pitch & docs →
        </Link>
      </form>
    </div>
  )
}

function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const { ui, locale } = useI18n()
  const {
    shop,
    loading,
    setShopData,
    updateStock,
    addProduct,
    analytics,
    forecasts,
    alerts,
    graph,
    dataInsights,
    isCloud,
  } = useShopData(user.username, locale)

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
        {ui.loading}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header shopName={shop?.shopName} isCloud={isCloud} userName={user.displayName} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 space-y-4">
        <SetupBanner />
        <TechStackPanel />

        {!shop ? (
          <div className="space-y-4">
            <CsvUpload onLoaded={setShopData} />
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-left">
              <p className="text-sm font-medium text-slate-700">{ui.startWithoutCsv}</p>
              <p className="text-xs text-slate-500 mt-1">{ui.addFirstProductHint}</p>
              <div className="mt-2">
                <AddProductForm onAdd={addProduct} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
              <span>
                {shop.rowCount?.toLocaleString()} {ui.rowsProducts} · {shop.products.length} {ui.products}
              </span>
              <div className="flex gap-3 items-center">
                <AddProductForm onAdd={addProduct} />
                <CsvUpload onLoaded={setShopData} hasExistingData />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(ui.replaceData)) {
                      clearLocalShop(user.username)
                      window.location.reload()
                    }
                  }}
                  className="text-slate-500 hover:underline"
                >
                  {ui.resetData}
                </button>
              </div>
            </div>

            {analytics && (
              <>
                <KpiCards analytics={analytics} />
                <AutoInsightCards insights={dataInsights} />
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {graph && <GraphPanel graph={graph} />}
              {analytics && forecasts && <NlQueryBar shop={shop} analytics={analytics} forecasts={forecasts} />}
            </div>

            {analytics && (
              <RootCausePanel products={shop.products} sales={shop.sales} analytics={analytics} />
            )}

            <AlertsPanel alerts={alerts} />

            {analytics && (
              <AiInsightPanel
                shopName={shop.shopName}
                analytics={analytics}
                forecasts={forecasts}
                alerts={alerts}
                products={shop.products}
                sales={shop.sales}
                graph={graph ?? undefined}
              />
            )}

            <SalesChart sales={shop.sales} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {analytics && <CategoryChart analytics={analytics} />}
              <ForecastChart forecasts={forecasts} />
            </div>

            <StockTable
              products={shop.products}
              forecasts={forecasts}
              onUpdateStock={updateStock}
            />
          </>
        )}
      </main>

      <footer className="py-3 text-center text-[10px] text-slate-400 border-t border-slate-200/60">
        ShopSense AI · BuildFest 2026 ·{' '}
        <Link to="/docs" className="text-brand-500 hover:underline">
          /docs
        </Link>
      </footer>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => getSessionUser())

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {user ? <Dashboard user={user} onLogout={handleLogout} /> : <LoginPanel onLoggedIn={setUser} />}
      </I18nProvider>
    </QueryClientProvider>
  )
}
