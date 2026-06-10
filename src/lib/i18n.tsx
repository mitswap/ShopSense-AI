import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { bn } from '../locales/bn'
import { en } from '../locales/en'
import type { Locale } from './i18n-types'
import { I18nContext, type I18nContextValue } from './i18n-context'
export type { Locale, UiText } from './i18n-types'
export type { I18nContextValue } from './i18n-context'

const STORAGE_KEY = 'sme-ai-dashboard-locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'bn' ? 'bn' : 'en'
  })

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const ui = locale === 'bn' ? bn : en
    const currencyLocale = locale === 'bn' ? 'bn-BD' : 'en-US'
    const symbol = locale === 'bn' ? '৳' : 'Tk '
    return {
      locale,
      setLocale,
      ui,
      currency: (amount: number) => `${symbol}${Math.round(amount).toLocaleString(currencyLocale)}`,
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
