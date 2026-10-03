import type { CountryCode } from '@/types/country'

export interface ProfileInput {
  countryCode: CountryCode
  monthlyIncome: number | null
  monthlyExpenses: number | null
  existingDebtPayments: number | null
  creditScore: number | null
  savingsBalance: number | null
  riskTolerance: 'conservative' | 'balanced' | 'aggressive' | null
}

export interface ProfileHealth {
  /** 0-100. A rough read, not a score any lender uses. */
  score: number
  debtToIncome: number | null
  savingsRate: number | null
  /** Months of expenses covered by savings. */
  emergencyFundMonths: number | null
  signals: { label: string; status: 'good' | 'watch' | 'attention'; detail: string }[]
  /** Fields still missing, so the UI can ask for them. */
  missing: string[]
}
