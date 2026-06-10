import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/useI18n'
import type { Locale } from '../lib/i18n-types'

interface HeaderProps {
  userName: string
  onLogout: () => void
}

export function Header({ userName, onLogout }: HeaderProps) {
  const { ui, locale, setLocale } = useI18n()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/Logo-ShopSense-AI.png"
            alt="ShopSense AI"
            className="h-12 w-auto max-w-[220px] object-contain sm:h-14 sm:max-w-[240px]"
          />
        </Link>
        <div className="grid grid-cols-2 items-center gap-2 sm:flex">
          <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm">
            {ui.language}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none"
            >
              <option value="en">{ui.english}</option>
              <option value="bn">{ui.bangla}</option>
            </select>
          </label>
          <span className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
            {userName}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="action-tile action-tile-compact justify-center text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            {ui.logout}
          </button>
        </div>
      </div>
    </header>
  )
}
