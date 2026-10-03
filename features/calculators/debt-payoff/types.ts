import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/common'

export type PayoffStrategy = 'avalanche' | 'snowball' | 'as-listed'

export interface Debt {
  id: string
  name: string
  balance: number
  /** Annual rate as a fraction. */
  annualRate: number
  minimumPayment: number
}

export interface DebtPayoffInput {
  debts: Debt[]
  /** Total monthly budget across all debts; the excess over minimums snowballs. */
  monthlyBudget: number
  strategy: PayoffStrategy
  countryCode: CountryCode
}

export interface DebtPayoffDetail {
  debtId: string
  name: string
  payoffMonth: number
  totalInterest: number
  totalPaid: number
}

export interface PayoffMonth {
  month: number
  totalBalance: number
  totalPaid: number
  interestPaid: number
}

export interface DebtPayoffResult {
  strategy: PayoffStrategy
  monthsToDebtFree: number
  totalInterest: number
  totalPaid: number
  perDebt: DebtPayoffDetail[]
  timeline: PayoffMonth[]
  /** Order debts are cleared in, first to last. */
  payoffOrder: string[]
  currency: CurrencyCode
  /** Set when the budget cannot cover the minimum payments. */
  shortfall: number | null
}

export interface StrategyComparison {
  avalanche: DebtPayoffResult
  snowball: DebtPayoffResult
  interestDifference: number
  monthsDifference: number
}
