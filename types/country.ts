import type { CurrencyCode, Language } from './common'

export type CountryCode = 'co' | 'us' | 'ca'

export interface CountryTerminology {
  mortgage: string
  downPayment: string
  interestRate: string
  creditScore: string
  loanTerm: string
  monthlyPayment: string
  savingsAccount: string
}

export interface FinancialRules {
  /** Typical minimum down payment as a fraction of property price. */
  minDownPaymentRatio: number
  /** Lender ceiling on debt-to-income, as a fraction. */
  maxDebtToIncome: number
  /** Whether the market quotes rates as effective annual (EA) instead of nominal. */
  quotesEffectiveAnnualRate: boolean
  creditScoreRange: { min: number; max: number }
  commonLoanTermsMonths: number[]
  /** Statutory usury / rate ceiling, annual fraction. Null where none applies. */
  rateCeiling: number | null
  /**
   * Whether savings and credit-card rates are quoted effective annual (E.A.).
   * Separate from `quotesEffectiveAnnualRate`, which is about loans: Canada
   * sets that one for mortgages, but quotes savings and cards nominal.
   */
  consumerRatesEffective: boolean
}

export interface CountryConfig {
  code: CountryCode
  name: string
  currency: CurrencyCode
  /** UI language for visitors in this country. */
  language: Language
  locale: string
  terminology: CountryTerminology
  rules: FinancialRules
}
