import type { CurrencyCode } from './common'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  /** Decimal places normally shown to a human. COP shows 0. */
  decimals: number
  /** BCP-47 locale used for Intl.NumberFormat. */
  locale: string
  symbolPosition: 'prefix' | 'suffix'
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', decimals: 2, locale: 'en-US', symbolPosition: 'prefix' },
  CAD: { code: 'CAD', symbol: '$', decimals: 2, locale: 'en-CA', symbolPosition: 'prefix' },
  COP: { code: 'COP', symbol: '$', decimals: 0, locale: 'es-CO', symbolPosition: 'prefix' },
}

export type { CurrencyCode }
