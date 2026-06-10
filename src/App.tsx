import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { startTransition, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  Brain,
  Database,
  PlusCircle,
  RotateCcw,
  Store,
  Upload,
} from 'lucide-react'
import { Header } from './components/Header'
import { CsvUpload } from './components/CsvUpload'
import { AddProductForm } from './components/AddProductForm'
import { MemoImportCard } from './components/MemoImportCard'
import { KpiCards } from './components/KpiCards'
import { StockTable } from './components/StockTable'
import { SalesChart } from './components/SalesChart'
import { ForecastChart } from './components/ForecastChart'
import { CategoryChart } from './components/CategoryChart'
import { AlertsPanel } from './components/AlertsPanel'
import { AiInsightPanel } from './components/AiInsightPanel'
import { AutoInsightCards } from './components/AutoInsightCards'
import { NlQueryBar, type AnalyzerMessage } from './components/NlQueryBar'
import { GraphPanel } from './components/GraphPanel'
import { RootCausePanel } from './components/RootCausePanel'
import { WeatherAdviceCard } from './components/WeatherAdviceCard'
import { useShopData } from './hooks/useShopData'
import { I18nProvider } from './lib/i18n'
import { useI18n } from './lib/useI18n'
import { getSessionUser, login, logout, type AppUser } from './lib/auth'
import { LandingPage as MarketingLandingPage } from './pages/LandingPage'
import type { AnalyticsSummary, BusinessGraph, MemoLineItem, Product, ProductForecast, ShopData } from './types'

const queryClient = new QueryClient()

function createAnalyzerIntroMessage(text: string): AnalyzerMessage {
  return {
    id: 'analyzer-intro',
    role: 'assistant',
    text,
    status: 'done',
  }
}

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
    <div className="min-h-screen grid place-items-center px-4 py-10 app-shell">
      <form onSubmit={submit} className="glass-card w-full max-w-md p-6">
        <div className="rounded-2xl bg-brand-600 p-4 text-white shadow-xl">
          <h2 className="text-2xl font-bold">{ui.loginTitle}</h2>
          <p className="mt-2 text-sm text-white/88">{ui.loginHint}</p>
        </div>
        <label className="mt-5 block">
          <span className="text-xs font-semibold text-slate-600">{ui.username}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm shadow-inner outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-slate-600">{ui.password}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm shadow-inner outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
        {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
        <div className="mt-5 grid grid-cols-1 gap-2">
          <button type="submit" className="action-tile action-tile-primary justify-center">
            {ui.signIn}
          </button>
          <Link to="/docs" className="action-tile justify-center text-xs">
            {ui.viewDocs}
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-slate-500">Demo account username: owner1 | password: shopsense123</p>
      </form>
    </div>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function DataEmptyState({
  onLoaded,
  onAdd,
  onImportMemo,
}: {
  onLoaded: Parameters<typeof CsvUpload>[0]['onLoaded']
  onAdd: Parameters<typeof AddProductForm>[0]['onAdd']
  onImportMemo: (rows: MemoLineItem[]) => void | Promise<void>
}) {
  const { ui } = useI18n()
  const [scratchFormOpen, setScratchFormOpen] = useState(false)

  return (
    <div className="grid items-start gap-4 xl:grid-cols-3">
      <CsvUpload onLoaded={onLoaded} />
      <MemoImportCard onImport={onImportMemo} />
      <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{ui.startFromScratchTitle}</h3>
            <p className="mt-1 text-xs text-slate-500">{ui.startFromScratchHint}</p>
          </div>
        </div>
        <div className="mt-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
          <button
            type="button"
            onClick={() => setScratchFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <PlusCircle className="h-4 w-4" />
            {ui.addProduct}
          </button>
          <p className="mt-3 text-xs text-slate-500">{ui.startFromScratchButtonHint}</p>
        </div>
      </div>
      {scratchFormOpen ? (
        <div className="xl:col-span-3">
          <AddProductForm
            onAdd={onAdd}
            open={scratchFormOpen}
            onOpenChange={setScratchFormOpen}
          />
        </div>
      ) : null}
    </div>
  )
}

function InventoryAddProductCard({
  productCount,
  onAdd,
}: {
  productCount: number
  onAdd: Parameters<typeof AddProductForm>[0]['onAdd']
}) {
  const { ui } = useI18n()
  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">
          {productCount} {ui.products}
        </p>
      </div>
      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <AddProductForm onAdd={onAdd} embedded />
      </div>
    </div>
  )
}

function DataSetupActions({
  productCount,
  onLoaded,
  onReset,
  existingProducts,
  onImportMemo,
}: {
  productCount: number
  onLoaded: Parameters<typeof CsvUpload>[0]['onLoaded']
  onReset: () => void | Promise<void>
  existingProducts: Product[]
  onImportMemo: (rows: MemoLineItem[]) => void | Promise<void>
}) {
  const { ui } = useI18n()
  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">
          {productCount} {ui.products}
        </p>
      </div>
        <div className="mt-4 grid w-full grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm text-left">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="flex items-center gap-3 text-emerald-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{ui.csvReplaceTitle}</h3>
                  <p className="text-xs text-slate-500">{ui.csvReplaceHint}</p>
                </div>
              </div>
              <div>
                <CsvUpload onLoaded={onLoaded} hasExistingData />
              </div>
            </div>
          </div>
          <MemoImportCard existingProducts={existingProducts} onImport={onImportMemo} compact />
          <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm text-left">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="flex items-center gap-3 text-rose-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{ui.resetCardTitle}</h3>
                  <p className="text-xs text-slate-500">{ui.resetCardHint}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(ui.replaceData)) {
                    await onReset()
                  }
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                {ui.resetData}
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}

function ProtectedContent({ ready, children }: { ready: boolean; children: ReactNode }) {
  const { ui } = useI18n()
  if (!ready) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm font-semibold text-slate-700">{ui.noData}</p>
        <Link to="/app/data" className="action-tile action-tile-primary mx-auto mt-4 max-w-xs justify-center">
          {ui.goToData}
        </Link>
      </div>
    )
  }
  return <>{children}</>
}

function AnalyticsLoadingCard({
  title,
  className = '',
  heightClass = 'h-56',
}: {
  title: string
  className?: string
  heightClass?: string
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
      </div>
      <div className={`mt-4 rounded-xl bg-slate-50 ${heightClass}`} />
    </div>
  )
}

function AnalyticsPage({
  shop,
  analytics,
  forecasts,
  graph,
  title,
  subtitle,
}: {
  shop: ShopData | null
  analytics: AnalyticsSummary | null
  forecasts: ProductForecast[]
  graph: BusinessGraph | null
  title: string
  subtitle: string
}) {
  const [showSecondaryCharts, setShowSecondaryCharts] = useState(false)
  const [showGraphPanel, setShowGraphPanel] = useState(false)

  useEffect(() => {
    setShowSecondaryCharts(false)
    setShowGraphPanel(false)

    let firstFrame = 0
    let secondFrame = 0
    let graphTimer: number | undefined

    firstFrame = window.requestAnimationFrame(() => {
      startTransition(() => setShowSecondaryCharts(true))
      secondFrame = window.requestAnimationFrame(() => {
        graphTimer = window.setTimeout(() => {
          startTransition(() => setShowGraphPanel(true))
        }, 70)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      if (graphTimer) window.clearTimeout(graphTimer)
    }
  }, [shop?.shopId, analytics?.totalRevenue, forecasts.length, graph?.edges.length])

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} />
      <ProtectedContent ready={Boolean(shop && analytics)}>
        {shop && analytics && (
          <>
            <SalesChart sales={shop.sales} />
            {showSecondaryCharts ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CategoryChart analytics={analytics} />
                <ForecastChart forecasts={forecasts} />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AnalyticsLoadingCard title="Category performance" />
                <AnalyticsLoadingCard title="Forecast view" />
              </div>
            )}
            {graph ? (
              showGraphPanel ? (
                <GraphPanel graph={graph} />
              ) : (
                <AnalyticsLoadingCard title="Product connections" heightClass="h-44" />
              )
            ) : null}
          </>
        )}
      </ProtectedContent>
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
    importMemoRows,
    resetShop,
    analytics,
    forecasts,
    alerts,
    graph,
    dataInsights,
    decisionFeed,
  } = useShopData(user.username, locale)
  const [analyzerMessages, setAnalyzerMessages] = useState<AnalyzerMessage[]>(() => [
    createAnalyzerIntroMessage(ui.analyzerWelcome),
  ])

  useEffect(() => {
    setAnalyzerMessages((current) => {
      const rest = current.filter((message) => message.id !== 'analyzer-intro')
      return [createAnalyzerIntroMessage(ui.analyzerWelcome), ...rest]
    })
  }, [ui.analyzerWelcome, shop?.shopId])

  const navItems = [
    { to: '/app', label: ui.navOverview, icon: Store, end: true },
    { to: '/app/advice', label: ui.navAdvice, icon: Brain },
    { to: '/app/analytics', label: ui.navAnalytics, icon: BarChart3 },
    { to: '/app/inventory', label: ui.navInventory, icon: Boxes },
    { to: '/app/data', label: ui.navData, icon: Database },
  ]

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center app-shell">
        <div className="glass-card px-5 py-3 text-sm font-medium text-slate-600">{ui.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen app-shell">
      <Header userName={user.displayName} onLogout={onLogout} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5">
        <nav className="feature-grid" aria-label="Dashboard pages">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `feature-link${isActive ? ' active' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <Routes>
          <Route
            index
            element={
              <div className="space-y-4">
                <PageHeader title={ui.overviewTitle} subtitle={ui.overviewSubtitle} />
                {!shop ? (
                  <DataEmptyState onLoaded={setShopData} onAdd={addProduct} onImportMemo={importMemoRows} />
                ) : (
                  <>
                    {analytics && <KpiCards analytics={analytics} />}
                    {analytics && <AutoInsightCards insights={dataInsights} />}
                    <AlertsPanel alerts={alerts} />
                    {analytics && forecasts && (
                      <NlQueryBar
                        shop={shop}
                        analytics={analytics}
                        forecasts={forecasts}
                        messages={analyzerMessages}
                        onMessagesChange={setAnalyzerMessages}
                        onReset={() => setAnalyzerMessages([createAnalyzerIntroMessage(ui.analyzerWelcome)])}
                      />
                    )}
                  </>
                )}
              </div>
            }
          />
          <Route
            path="advice"
            element={
              <div className="space-y-4">
                <PageHeader title={ui.advicePageTitle} subtitle={ui.advicePageSubtitle} />
                <ProtectedContent ready={Boolean(shop && analytics)}>
                  {shop && analytics && (
                    <>
                      <RootCausePanel
                        shopId={shop.shopId}
                        products={shop.products}
                        sales={shop.sales}
                        analytics={analytics}
                        forecasts={forecasts}
                        graph={graph ?? undefined}
                        decisionFeed={decisionFeed}
                      />
                      <AiInsightPanel
                        shopId={shop.shopId}
                        shopName={shop.shopName}
                        analytics={analytics}
                        forecasts={forecasts}
                        alerts={alerts}
                        products={shop.products}
                        sales={shop.sales}
                        graph={graph ?? undefined}
                      />
                      <WeatherAdviceCard
                        shopId={shop.shopId}
                        analytics={analytics}
                        products={shop.products}
                        forecasts={forecasts}
                      />
                    </>
                  )}
                </ProtectedContent>
              </div>
            }
          />
          <Route
            path="analytics"
            element={
              <AnalyticsPage
                shop={shop}
                analytics={analytics}
                forecasts={forecasts}
                graph={graph}
                title={ui.analyticsPageTitle}
                subtitle={ui.analyticsPageSubtitle}
              />
            }
          />
          <Route
            path="inventory"
            element={
              <div className="space-y-4">
                <PageHeader title={ui.inventoryPageTitle} subtitle={ui.inventoryPageSubtitle} />
                <ProtectedContent ready={Boolean(shop)}>
                  {shop && (
                    <>
                      <InventoryAddProductCard
                        productCount={shop.products.length}
                        onAdd={addProduct}
                      />
                      <StockTable products={shop.products} forecasts={forecasts} onUpdateStock={updateStock} />
                    </>
                  )}
                </ProtectedContent>
              </div>
            }
          />
          <Route
            path="data"
            element={
              <div className="space-y-4">
                <PageHeader title={ui.dataPageTitle} subtitle={ui.dataPageSubtitle} />
                {!shop ? (
                  <DataEmptyState onLoaded={setShopData} onAdd={addProduct} onImportMemo={importMemoRows} />
                ) : (
                  <DataSetupActions
                    productCount={shop.products.length}
                    onLoaded={setShopData}
                    onReset={resetShop}
                    existingProducts={shop.products}
                    onImportMemo={importMemoRows}
                  />
                )}
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-white/50 py-4 text-center text-[10px] text-slate-500">
        ShopSense AI | BuildFest 2026 |{' '}
        <Link to="/docs" className="font-semibold text-brand-600 hover:text-brand-700">
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
        <Routes>
          <Route path="/" element={<MarketingLandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginPanel onLoggedIn={setUser} />} />
          <Route path="/app/*" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </I18nProvider>
    </QueryClientProvider>
  )
}
