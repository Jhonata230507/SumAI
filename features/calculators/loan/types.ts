import type { CountryCode } from '@/types/country'
import type { CurrencyCode, Frequency } from '@/types/common'
import type { AmortizationSchedule } from '@/lib/calculations/amortization'

export interface LoanInput {
  amount: number
  /** Annual rate as a fraction: 0.0725 is 7.25%. */
  annualRate: number
  termMonths: number
  frequency: Frequency
  extraPayment: number
  originationFee: number
  countryCode: CountryCode
}

export interface LoanResult {
  payment: number
  frequency: Frequency
  totalPaid: number
  totalInterest: number
  totalFees: number
  /** Total cost expressed as a multiple of the amount borrowed. */
  costRatio: number
  payoffPeriods: number
  periodsSaved: number
  interestSaved: number
  effectiveAnnualRate: number
  currency: CurrencyCode
  schedule: AmortizationSchedule
}
