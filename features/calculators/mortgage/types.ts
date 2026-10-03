import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/common'
import type { AmortizationSchedule } from '@/lib/calculations/amortization'

export interface MortgageInput {
  homePrice: number
  downPayment: number
  annualRate: number
  termMonths: number
  /** Annual property tax as an amount, not a rate. */
  propertyTaxAnnual: number
  homeInsuranceAnnual: number
  hoaMonthly: number
  /** Annual mortgage-insurance rate on the outstanding balance. */
  mortgageInsuranceRate: number
  extraPayment: number
  countryCode: CountryCode
}

/** The monthly bill, broken into what the lender takes and what it passes through. */
export interface MonthlyBreakdown {
  principalAndInterest: number
  propertyTax: number
  insurance: number
  hoa: number
  mortgageInsurance: number
  total: number
}

export interface MortgageResult {
  loanAmount: number
  downPaymentRatio: number
  loanToValue: number
  monthly: MonthlyBreakdown
  totalPaid: number
  totalInterest: number
  payoffPeriods: number
  periodsSaved: number
  interestSaved: number
  /** True when the down payment is below the country threshold. */
  requiresMortgageInsurance: boolean
  /** Period at which the balance crosses 80% LTV and insurance can drop. */
  mortgageInsuranceEndsPeriod: number | null
  currency: CurrencyCode
  schedule: AmortizationSchedule
}

export interface AffordabilityInput {
  monthlyIncome: number
  monthlyDebts: number
  downPayment: number
  annualRate: number
  termMonths: number
  countryCode: CountryCode
}

export interface AffordabilityResult {
  maxHomePrice: number
  maxLoanAmount: number
  maxMonthlyPayment: number
  debtToIncome: number
  currency: CurrencyCode
}
