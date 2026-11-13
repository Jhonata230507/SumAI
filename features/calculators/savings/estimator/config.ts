import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/currency'
import { US_SAVINGS } from './countries/us'

export const SAVINGS_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'annually'] as const
export type SavingsFrequency = (typeof SAVINGS_FREQUENCIES)[number]

export const PERIODS_PER_YEAR: Record<SavingsFrequency, number> = { weekly: 52, biweekly: 26, monthly: 12, annually: 1 }

/** How a typed rate is quoted: APY already includes compounding; APR is nominal and compounds `k` times a year. */
export type RateBasis = 'apy' | 'apr'

/**
 * Everything one country's savings estimator needs. The calculation and the UI
 * read this and nothing else, so a new country is a new config.
 */
export interface SavingsCountryConfig {
  country: CountryCode
  currency: CurrencyCode
  locale: string
  frequencies: SavingsFrequency[]
  defaultFrequency: SavingsFrequency
  /** How rates are usually advertised: the basis the rate field opens in. */
  defaultBasis: RateBasis
  /** Compounding choices for an APR, times a year, and the default. */
  compounding: number[]
  defaultCompounding: number
  /** The duration the user types, in months: bounds and the example shown while empty. */
  duration: { minMonths: number; maxMonths: number; exampleMonths: number }
  /** "How long?" stops looking past this many years and says the goal is out of reach. */
  maxYearsToGoal: number
  /**
   * ESTIMATES, used when a field is left empty and labelled as estimates.
   * Savings rates vary a lot by account and bank: verify before launch.
   */
  estimates: { apy: number; inflation: number }
}

const CONFIGS: Partial<Record<CountryCode, SavingsCountryConfig>> = {
  us: US_SAVINGS,
}

/** The estimator config for a country, or null when the country uses the classic calculator. */
export function getSavingsConfig(country: CountryCode): SavingsCountryConfig | null {
  return CONFIGS[country] ?? null
}
