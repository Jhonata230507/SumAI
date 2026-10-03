import type { CountryCode } from '@/types/country'
import type { GrowthSeries } from '@/lib/calculations/compound-interest'

export interface GoalInput {
  name: string
  type: 'savings' | 'debt-free' | 'purchase' | 'retirement'
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  monthlyContribution: number | null
  /** Expected annual return on the money set aside. */
  annualReturn: number
  countryCode: CountryCode
}

export interface GoalProjection {
  /** Fraction complete, 0 to 1. */
  progress: number
  monthsRemaining: number | null
  projectedDate: string | null
  /** Contribution needed to land on the target date. */
  requiredMonthly: number | null
  /** Gap between the required and the current contribution. */
  contributionGap: number | null
  onTrack: boolean
  projectedBalance: number
  points: { month: number; balance: number; target: number }[]
  /** Full contribution/growth series, for the growth chart. */
  series: GrowthSeries
}
