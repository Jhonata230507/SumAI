import type { CountryCode } from '@/types/country'
import type { CurrencyCode, Frequency } from '@/types/common'
import type { GrowthSeries } from '@/lib/calculations/compound-interest'

export type SavingsMode = 'project' | 'target'

export interface SavingsInput {
  /** `project` grows a known deposit; `target` solves for the deposit needed. */
  mode: SavingsMode
  initialAmount: number
  deposit: number
  depositFrequency: Frequency
  /** Quoted annual yield as a fraction. */
  annualRate: number
  /** How often the bank compounds, which can differ from the deposit frequency. */
  compoundsPerYear: number
  months: number
  targetAmount: number | null
  countryCode: CountryCode
}

export interface SavingsResult {
  finalBalance: number
  totalDeposited: number
  totalInterest: number
  effectiveAnnualYield: number
  /** In `target` mode, the deposit that reaches the goal. */
  requiredDeposit: number | null
  /** In `target` mode, months to the goal at the current deposit. */
  monthsToTarget: number | null
  reachesTarget: boolean
  currency: CurrencyCode
  series: GrowthSeries
}
