import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { bn } from '../locales/bn'
import { en } from '../locales/en'

export type Locale = 'en' | 'bn'
export type UiText = Record<keyof typeof en, string>

const STORAGE_KEY = 'sme-ai-dashboard-locale'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  ui: UiText
  currency: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'bn' ? 'bn' : 'en'
  })

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const value = useMemo<I18nContextValue>(() => {
    const ui = locale === 'bn' ? bn : en
    const currencyLocale = locale === 'bn' ? 'bn-BD' : 'en-US'
    return {
      locale,
      setLocale,
      ui,
      currency: (value: number) => `৳${Math.round(value).toLocaleString(currencyLocale)}`,
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
