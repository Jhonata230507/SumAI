import type { CountryCode } from '@/types/country'
import type { CurrencyCode, Frequency } from '@/types/common'
import type { GrowthSeries } from '@/lib/calculations/compound-interest'

export interface InvestmentInput {
  initialAmount: number
  contribution: number
  contributionFrequency: Frequency
  /** Expected nominal annual return as a fraction. */
  annualReturn: number
  years: number
  /** Annual expense ratio charged on the balance. */
  feeRate: number
  inflationRate: number
  /** Annual raise applied to the contribution. */
  contributionGrowth: number
  countryCode: CountryCode
}

export interface InvestmentResult {
  finalBalance: number
  /** Final balance restated in today's money. */
  realBalance: number
  totalContributed: number
  totalGrowth: number
  totalFees: number
  /** Growth as a multiple of what was put in. */
  multiple: number
  currency: CurrencyCode
  series: GrowthSeries
  /** Same inputs at a better and worse return, for the range band. */
  range: { pessimistic: number; expected: number; optimistic: number }
}
