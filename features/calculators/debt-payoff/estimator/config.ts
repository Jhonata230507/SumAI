import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/currency'
import { US_DEBT_PAYOFF } from './countries/us'

/**
 * Everything one country's debt payoff planner needs. The calculation and the
 * UI read this and nothing else, so a new country is a new config.
 */
export interface DebtPayoffCountryConfig {
  country: CountryCode
  currency: CurrencyCode
  locale: string
  /** The most debts the list takes. */
  maxDebts: number
  /** The simulation stops here and says the plan does not pay the debts off. */
  maxYears: number
  /** "Try an example": the debts and monthly amount it fills in. */
  example: {
    debts: { name: string; balance: number; apr: number; minimum: number }[]
    monthlyAmount: number
  }
}

const CONFIGS: Partial<Record<CountryCode, DebtPayoffCountryConfig>> = {
  us: US_DEBT_PAYOFF,
}

/** The planner config for a country, or null when the country uses the classic calculator. */
export function getDebtPayoffConfig(country: CountryCode): DebtPayoffCountryConfig | null {
  return CONFIGS[country] ?? null
}
