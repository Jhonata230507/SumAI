'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { getCountry } from '@/lib/countries'
import { getDictionary, type Dictionary } from './index'
import type { CountryCode } from '@/types/country'
import type { Language } from '@/types/common'

interface I18nValue {
  t: Dictionary
  language: Language
  /** BCP-47 locale for number, currency and date formatting. */
  locale: string
  countryCode: CountryCode
}

const I18nContext = createContext<I18nValue | null>(null)

/**
 * Takes a country code rather than a dictionary: dictionaries contain
 * functions, which cannot cross the server-to-client boundary as props.
 */
export function I18nProvider({
  countryCode,
  children,
}: {
  countryCode: CountryCode
  children: ReactNode
}) {
  const country = getCountry(countryCode)
  const value: I18nValue = {
    t: getDictionary(country.language),
    language: country.language,
    locale: country.locale,
    countryCode,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
