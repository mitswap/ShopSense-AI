import { Store } from 'lucide-react'
import { useI18n, type Locale } from '../lib/i18n'

interface HeaderProps {
  shopName?: string
  isCloud: boolean
  userName: string
  onLogout: () => void
}

export function Header({ shopName, isCloud, userName, onLogout }: HeaderProps) {
  const { ui, locale, setLocale } = useI18n()

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Store className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold text-slate-900">ShopSense AI</h1>
            {shopName ? (
              <p className="text-xs text-slate-500">{shopName}</p>
            ) : (
              <p className="text-xs text-slate-500">{ui.appSubtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isCloud ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isCloud ? ui.cloudMode : ui.demoMode}
          </span>
          <label className="text-xs text-slate-600 flex items-center gap-1">
            {ui.language}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="border border-slate-300 rounded px-1.5 py-1 text-xs bg-white"
            >
              <option value="en">{ui.english}</option>
              <option value="bn">{ui.bangla}</option>
            </select>
          </label>
          <span className="text-xs text-slate-500">{userName}</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            {ui.logout}
          </button>
        </div>
      </div>
    </header>
  )
}
