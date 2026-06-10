import { createContext } from 'react'
import type { Locale, UiText } from './i18n-types'

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  ui: UiText
  currency: (value: number) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
