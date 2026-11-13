import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/currency'
import { US_INVESTMENT } from './countries/us'

export const CONTRIBUTION_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'annually'] as const
export type ContributionFrequency = (typeof CONTRIBUTION_FREQUENCIES)[number]

export const PERIODS_PER_YEAR: Record<ContributionFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  annually: 1,
}

/**
 * How the account is taxed: on the gains when sold (taxable), on everything
 * when withdrawn (tax-deferred), not at all (tax-free), or not said, in which
 * case no after-tax figure is shown.
 */
export const ACCOUNT_TYPES = ['unspecified', 'taxable', 'deferred', 'free'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

/**
 * Everything one country's investment estimator needs. The calculation and the
 * UI read this and nothing else, so a new country is a new config.
 */
export interface InvestmentCountryConfig {
  country: CountryCode
  currency: CurrencyCode
  locale: string
  /** Contribution frequencies offered, and the one selected at first. */
  frequencies: ContributionFrequency[]
  defaultFrequency: ContributionFrequency
  /** Account types offered, 'unspecified' first. */
  accountTypes: AccountType[]
  /** The duration the user types, in years: the bounds and the example shown while empty. */
  years: { min: number; max: number; example: number }
  /**
   * ESTIMATES, used when a field is left empty and labelled as estimates.
   * Rates are fractions (0.07 is 7%).
   */
  estimates: {
    annualReturn: number
    inflation: number
    /** Tax rate by account type, where the account is taxed. */
    taxRate: Partial<Record<AccountType, number>>
  }
  /** How far the weaker and stronger outcomes sit from the expected return. */
  rangeBand: number
  /** "Try an example": the values it fills in, for each mode. */
  example: {
    initialAmount: number
    contribution: number
    years: number
    targetAmount: number
  }
}

const CONFIGS: Partial<Record<CountryCode, InvestmentCountryConfig>> = {
  us: US_INVESTMENT,
}

/** The estimator config for a country, or null when the country uses the classic calculator. */
export function getInvestmentConfig(country: CountryCode): InvestmentCountryConfig | null {
  return CONFIGS[country] ?? null
}
