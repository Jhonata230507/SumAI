import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/common'
import type { AmortizationSchedule } from '@/lib/calculations/amortization'
import type { CreditBand, InsuranceDuration, LoanType } from './us'

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
  /*
   * US only. With a loan type, its program rules set the upfront fee and the
   * mortgage insurance; without one, the country threshold rule applies.
   */
  loanType?: LoanType
  creditBand?: CreditBand | null
  zip?: string
  /** Gross household income, per year. */
  annualIncome?: number
  /** Other monthly debt payments: car, student loans, card minimums. */
  monthlyDebts?: number
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
  /** Upfront program fee (FHA MIP, VA funding fee, USDA guarantee) financed into the loan. */
  upfrontFee: number
  insuranceDuration: InsuranceDuration | null
  /** The program minimum down payment, when a loan type is set. */
  minDownRatio: number | null
  /** Debt-to-income, when income is known: housing only, and housing plus other debts. */
  debtToIncome: { front: number; back: number; frontLimit: number | null; backLimit: number } | null
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
