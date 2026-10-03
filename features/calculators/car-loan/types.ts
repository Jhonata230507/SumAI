import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/common'
import type { AmortizationSchedule } from '@/lib/calculations/amortization'

export interface CarLoanInput {
  vehiclePrice: number
  downPayment: number
  tradeInValue: number
  /** Outstanding balance on the trade-in, rolled into the new loan if negative equity. */
  tradeInOwed: number
  salesTaxRate: number
  feesAndRegistration: number
  annualRate: number
  termMonths: number
  countryCode: CountryCode
}

export interface CarLoanResult {
  amountFinanced: number
  monthlyPayment: number
  totalPaid: number
  totalInterest: number
  salesTax: number
  /** Trade-in equity: positive adds to the down payment, negative is rolled in. */
  tradeInEquity: number
  /** Loan-to-value at signing. Above 1 means underwater from day one. */
  initialLoanToValue: number
  /** Period where the loan balance first drops below the depreciated car value. */
  breakEvenPeriod: number | null
  currency: CurrencyCode
  schedule: AmortizationSchedule
}

export interface DepreciationPoint {
  period: number
  vehicleValue: number
  loanBalance: number
  equity: number
}
