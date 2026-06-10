import type { en } from '../locales/en'

export type Locale = 'en' | 'bn'
export type UiText = Record<keyof typeof en, string>
